import { App } from '@slack/bolt';
import { createLogger } from '../utils/logger';
import { processCommand } from './claudeService';

const logger = createLogger('slackBot');

// Regex patterns for command parsing
const REVIEW_PATTERN = /^review\s+([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)#(\d+)\s*$/i;
const RULES_PATTERN = /^rules\s+([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)\s*$/i;
const STATUS_PATTERN = /^status\s*$/i;

/**
 * Parse the command text from a Slack mention event (strips the bot mention prefix)
 */
function parseCommandText(text: string): string {
  // Remove <@USERID> mention prefix and trim whitespace
  return text.replace(/^<@[A-Z0-9]+>\s*/i, '').trim();
}

/**
 * Handle the `review owner/repo#<number>` command
 */
async function handleReviewCommand(
  repoFullName: string,
  issueNumber: number,
  say: (payload: { text: string; thread_ts?: string }) => Promise<unknown>,
  threadTs: string
): Promise<void> {
  await say({
    text: `PR #${issueNumber} 리뷰를 시작합니다... (\`${repoFullName}\`)`,
    thread_ts: threadTs
  });

  try {
    const result = await processCommand({
      repoFullName,
      issueNumber,
      command: `Review the pull request #${issueNumber} in ${repoFullName}. Provide a thorough code review with feedback on correctness, style, and potential issues.`,
      isPullRequest: true,
      operationType: 'pr-review'
    });

    await say({ text: result || '리뷰가 완료되었습니다.', thread_ts: threadTs });
  } catch (err) {
    logger.error({ err, repoFullName, issueNumber }, 'PR review command failed');
    await say({
      text: `리뷰 중 오류가 발생했습니다: ${(err as Error).message}`,
      thread_ts: threadTs
    });
  }
}

/**
 * Handle the `rules owner/repo` command — fetch CLAUDE.md / .claude/rules from the repo
 */
async function handleRulesCommand(
  repoFullName: string,
  say: (payload: { text: string; thread_ts?: string }) => Promise<unknown>,
  threadTs: string
): Promise<void> {
  await say({ text: `\`${repoFullName}\` 레포의 룰을 조회합니다...`, thread_ts: threadTs });

  try {
    const result = await processCommand({
      repoFullName,
      issueNumber: null,
      command: `Read the repository rules and conventions for ${repoFullName}. Look for CLAUDE.md, .claude/rules, .claude/settings.json, and any other configuration files that define project conventions. Summarize the key rules and guidelines.`,
      isPullRequest: false,
      operationType: 'default'
    });

    await say({ text: result || '룰 파일을 찾을 수 없습니다.', thread_ts: threadTs });
  } catch (err) {
    logger.error({ err, repoFullName }, 'Rules command failed');
    await say({
      text: `룰 조회 중 오류가 발생했습니다: ${(err as Error).message}`,
      thread_ts: threadTs
    });
  }
}

/**
 * Handle the `status` command — report service health
 */
async function handleStatusCommand(
  say: (payload: { text: string; thread_ts?: string }) => Promise<unknown>,
  threadTs: string
): Promise<void> {
  const uptime = process.uptime();
  const uptimeFormatted = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;

  const statusText = [
    '*서비스 상태*',
    `• 상태: 정상`,
    `• 업타임: ${uptimeFormatted}`,
    `• Node.js: ${process.version}`,
    `• 환경: ${process.env['NODE_ENV'] ?? 'development'}`
  ].join('\n');

  await say({ text: statusText, thread_ts: threadTs });
}

/**
 * Handle general code/text analysis via Claude
 */
async function handleGeneralQuery(
  query: string,
  say: (payload: { text: string; thread_ts?: string }) => Promise<unknown>,
  threadTs: string
): Promise<void> {
  await say({ text: '분석 중...', thread_ts: threadTs });

  try {
    // For general queries we use a placeholder repo since claudeService requires one.
    // The command itself contains all the context Claude needs.
    const placeholderRepo = process.env['BOT_USERNAME']
      ? `${process.env['BOT_USERNAME'].replace('@', '')}/general`
      : 'genie-bot/general';

    const result = await processCommand({
      repoFullName: placeholderRepo,
      issueNumber: null,
      command: query,
      isPullRequest: false,
      operationType: 'default'
    });

    await say({ text: result || '응답을 생성하지 못했습니다.', thread_ts: threadTs });
  } catch (err) {
    logger.error({ err, query }, 'General query failed');
    await say({
      text: `처리 중 오류가 발생했습니다: ${(err as Error).message}`,
      thread_ts: threadTs
    });
  }
}

/**
 * Create and configure the Slack Bolt App instance
 */
export function createSlackApp(): App {
  const botToken = process.env['SLACK_BOT_TOKEN'];
  const appToken = process.env['SLACK_APP_TOKEN'];
  const signingSecret = process.env['SLACK_SIGNING_SECRET'] ?? 'dummy-secret';

  if (!botToken || !appToken) {
    throw new Error('SLACK_BOT_TOKEN and SLACK_APP_TOKEN are required');
  }

  const app = new App({
    token: botToken,
    appToken,
    signingSecret,
    socketMode: true
  });

  // Handle app_mention events
  app.event('app_mention', async ({ event, say, ack }) => {
    // Acknowledge immediately to satisfy Slack's 3-second requirement
    if (typeof ack === 'function') {
      await (ack as () => Promise<void>)();
    }

    const eventWithText = event as { thread_ts?: string; ts: string; text: string };
    const threadTs = eventWithText.thread_ts ?? eventWithText.ts;
    const rawText = eventWithText.text;
    const commandText = parseCommandText(rawText);

    logger.info({ commandText, threadTs }, 'Received Slack app_mention');

    // Route to appropriate handler
    const reviewMatch = REVIEW_PATTERN.exec(commandText);
    const rulesMatch = RULES_PATTERN.exec(commandText);

    if (reviewMatch) {
      const [, repoFullName = '', issueStr = '0'] = reviewMatch;
      const issueNumber = parseInt(issueStr, 10);
      await handleReviewCommand(repoFullName, issueNumber, say, threadTs);
    } else if (rulesMatch) {
      const [, repoFullName = ''] = rulesMatch;
      await handleRulesCommand(repoFullName, say, threadTs);
    } else if (STATUS_PATTERN.test(commandText)) {
      await handleStatusCommand(say, threadTs);
    } else if (commandText.length > 0) {
      await handleGeneralQuery(commandText, say, threadTs);
    } else {
      await say({
        text: [
          '사용 가능한 커맨드:',
          '• `review owner/repo#<number>` — PR 리뷰 요청',
          '• `rules owner/repo` — 레포 룰 조회',
          '• `status` — 서비스 상태 확인',
          '• 또는 자유롭게 질문하세요!'
        ].join('\n'),
        thread_ts: threadTs
      });
    }
  });

  return app;
}

/**
 * Start the Slack bot (Socket Mode — no HTTP endpoint required)
 */
export async function startSlackBot(): Promise<void> {
  const app = createSlackApp();

  await app.start();

  logger.info('Slack bot started in Socket Mode');
}

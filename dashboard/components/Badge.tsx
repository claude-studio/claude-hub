const colorMap = {
  green: "bg-green-900/40 text-green-400 ring-green-800/50",
  red: "bg-red-900/40 text-red-400 ring-red-800/50",
  blue: "bg-blue-900/40 text-blue-400 ring-blue-800/50",
  yellow: "bg-yellow-900/40 text-yellow-400 ring-yellow-800/50",
  gray: "bg-gray-800/60 text-gray-400 ring-gray-700/50",
  purple: "bg-purple-900/40 text-purple-400 ring-purple-800/50",
  orange: "bg-orange-900/40 text-orange-400 ring-orange-800/50",
};

interface BadgeProps {
  children: React.ReactNode;
  color?: keyof typeof colorMap;
}

export default function Badge({ children, color = "gray" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1 ring-inset ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}

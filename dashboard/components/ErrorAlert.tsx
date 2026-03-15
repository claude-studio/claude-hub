export default function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl p-4 text-sm border"
      style={{ background: "#FFF1F0", borderColor: "#FFCCC7", color: "#CF1322" }}
    >
      {message}
    </div>
  );
}

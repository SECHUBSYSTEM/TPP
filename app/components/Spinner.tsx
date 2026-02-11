export function Spinner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-block size-6 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

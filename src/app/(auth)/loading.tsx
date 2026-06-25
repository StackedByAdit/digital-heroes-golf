export default function AuthLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white"
        aria-label="Loading"
      />
    </div>
  );
}

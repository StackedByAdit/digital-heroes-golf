export default function PublicLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-green/20 border-t-brand-green"
        aria-label="Loading"
      />
    </div>
  );
}

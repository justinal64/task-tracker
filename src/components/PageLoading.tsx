export default function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent"
      />
    </div>
  );
}

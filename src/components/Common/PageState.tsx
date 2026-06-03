interface PageStateProps {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export function PageLoading() {
  return (
    <div className="h-72 flex items-center justify-center text-sm text-gray-500">
      Loading data...
    </div>
  );
}

export function PageError({ error, onRetry }: PageStateProps) {
  return (
    <div className="h-72 flex flex-col items-center justify-center gap-3 text-center px-4">
      <p className="text-sm text-red-600 max-w-lg">{error || 'Unable to load data.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-maersk-blue text-white text-sm rounded-lg hover:bg-maersk-navy transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

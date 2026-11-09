import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load data. The service might be temporarily unavailable.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-status-danger/20 bg-rose-50/50 dark:bg-rose-950/20 my-4">
      <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/40 text-status-danger mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        Something went wrong
      </h3>
      <p className="text-sm text-text-muted max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-card border border-border text-xs font-semibold hover:bg-bg-muted transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
};

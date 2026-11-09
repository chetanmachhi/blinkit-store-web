import React from "react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading data...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center my-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mb-3" />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
};

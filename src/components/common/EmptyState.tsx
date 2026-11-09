import React from "react";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data found",
  description = "There are no records to display at this time.",
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-bg-card/50 my-4">
      <div className="p-3 rounded-full bg-brand-soft text-brand mb-4">
        {icon || <PackageOpen className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

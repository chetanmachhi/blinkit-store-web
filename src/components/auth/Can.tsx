import React from "react";
import { useCan } from "../../store/authStore";

interface CanProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({
  permission,
  children,
  fallback = null,
}) => {
  const allowed = useCan(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
};

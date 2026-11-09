import React, { useEffect, useState } from "react";
import { RefreshCw, Server, AlertTriangle } from "lucide-react";
import { authService } from "../../api/auth.service";

interface ColdStartModalProps {
  onAwake?: () => void;
}

export const ColdStartModal: React.FC<ColdStartModalProps> = ({ onAwake }) => {
  const [isWaking, setIsWaking] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  const checkHealth = async () => {
    if (isLocal) {
      const ok = await authService.pingHealth(5000);
      if (ok && onAwake) onAwake();
      return;
    }

    setHasTimedOut(false);
    setSecondsElapsed(0);

    const slowTimer = setTimeout(() => {
      setIsWaking(true);
    }, 1500);

    const intervalTimer = setInterval(() => {
      setSecondsElapsed((prev) => {
        if (prev >= 85) {
          setHasTimedOut(true);
          setIsWaking(false);
        }
        return prev + 1;
      });
    }, 1000);

    try {
      const ok = await authService.pingHealth(90000);
      clearTimeout(slowTimer);
      clearInterval(intervalTimer);

      if (ok) {
        setIsWaking(false);
        setHasTimedOut(false);
        if (onAwake) onAwake();
      } else {
        setIsWaking(false);
        setHasTimedOut(true);
      }
    } catch {
      clearTimeout(slowTimer);
      clearInterval(intervalTimer);
      setIsWaking(false);
      setHasTimedOut(true);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (isLocal || (!isWaking && !hasTimedOut)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-main/95 backdrop-blur-sm p-4">
      <div className="max-w-md w-full bg-bg-card rounded-2xl border border-border p-6 shadow-2xl text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center">
          {hasTimedOut ? (
            <AlertTriangle className="w-8 h-8 text-status-warning animate-bounce" />
          ) : (
            <Server className="w-8 h-8 text-brand animate-pulse" />
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-text-primary">
            {hasTimedOut
              ? "Backend Server is taking longer than usual"
              : "Waking up the server, this can take up to a minute"}
          </h2>
          <p className="text-sm text-text-muted">
            The demonstration backend is hosted on a free cloud tier that enters sleep mode when idle.
            {hasTimedOut
              ? " Please verify your connection or click retry."
              : ` Elapsed: ${secondsElapsed}s (retrying automatically)`}
          </p>
        </div>

        <div className="w-full bg-border rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min((secondsElapsed / 60) * 100, 100)}%` }}
          />
        </div>

        <button
          onClick={checkHealth}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-colors w-full"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection Now
        </button>
      </div>
    </div>
  );
};

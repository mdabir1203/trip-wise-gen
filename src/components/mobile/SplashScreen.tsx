import { useEffect, useState } from "react";
import { Backpack } from "lucide-react";

interface SplashScreenProps {
  duration?: number;
  onFinish: () => void;
}

export function SplashScreen({ duration = 2400, onFinish }: SplashScreenProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, Math.max(1000, duration - 450));

    const exitTimer = window.setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
    };
  }, [duration, onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent text-white transition-opacity duration-500 ${
        isLeaving ? "fade-out" : "fade-in"
      } mobile-safe-area`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm">
          <Backpack className="h-14 w-14 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-white/70">Trip Wise</p>
          <h1 className="text-3xl font-semibold tracking-tight">Smart Packing Assistant</h1>
        </div>
      </div>
    </div>
  );
}

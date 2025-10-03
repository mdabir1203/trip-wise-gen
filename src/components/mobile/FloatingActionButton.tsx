import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  icon: ReactNode;
  label?: string;
  onClick: () => void;
}

export function FloatingActionButton({ icon, label, onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-4",
        "text-primary-foreground font-semibold shadow-lg fab-shadow transition-transform duration-200",
        "touch-target hover:scale-105 active:scale-95"
      )}
      aria-label={label ?? "Primary action"}
    >
      {icon}
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TabItem {
  key: string;
  label: string;
  icon: ReactNode;
}

interface BottomTabBarProps {
  activeTab: string;
  onChange: (key: string) => void;
  items: TabItem[];
}

export function BottomTabBar({ activeTab, onChange, items }: BottomTabBarProps) {
  return (
    <nav className="mobile-bottom-tab-bar border-t border-border/60 px-4 py-2">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-2">
        {items.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs font-medium transition-all",
                "touch-target",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70"
              )}
              aria-pressed={isActive}
            >
              <span className={cn("transition-transform", isActive ? "scale-110" : "scale-100")}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

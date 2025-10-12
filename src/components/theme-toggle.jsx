"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { state } = useSidebar();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Light Mode" : "Dark Mode";

  const button = (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="text-sidebar-foreground hover:text-sidebar-accent-foreground w-full flex items-center justify-center gap-2 text-sm py-3 border-t group-data-[state=collapsed]:border-0 group-data-[state=collapsed]:justify-start group-data-[state=collapsed]:px-2 group-data-[state=collapsed]:py-2"
    >
      <Icon size={18} />
      <span className="group-data-[state=collapsed]:hidden">{label}</span>
    </button>
  );

  if (state === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={0}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};

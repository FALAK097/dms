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
import { Button } from "@/components/ui/button";

export const ThemeToggle = ({ compact = false }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { state } = useSidebar();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Light Mode" : "Dark Mode";

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={label}
      >
        <Icon className="h-4 w-4" />
        <span className="sr-only">{label}</span>
      </Button>
    );
  }

  const button = (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      className="flex w-full items-center justify-start gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]/sidebar-wrapper:justify-center"
    >
      <Icon size={18} />
      <span className="group-data-[collapsible=icon]/sidebar-wrapper:sr-only">{label}</span>
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

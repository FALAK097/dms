"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { MoonIcon, Sun01Icon } from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun01Icon : MoonIcon;
  const label = isDark ? "Light Mode" : "Dark Mode";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <HugeiconsIcon icon={Icon} className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}

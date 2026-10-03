"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  outline: "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

const sizes = {
  default: "h-10 px-4 py-2",
  sm: "h-8 gap-1.5 rounded-md px-3 text-xs",
  icon: "size-10",
};

export function BaseChatButton({
  variant = "default",
  size = "default",
  className,
  type = "button",
  ...props
}) {
  return (
    <BaseButton
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        variants[variant] || variants.default,
        sizes[size] || sizes.default,
        className
      )}
      {...props}
    />
  );
}

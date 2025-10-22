"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gradient" | "glass" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "gradient", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "hover:scale-105 hover:shadow-lg active:scale-95",
          {
            "bg-gradient-to-r from-[#6e8efb] to-[#a777e3] text-white border-0 shadow-md hover:shadow-xl":
              variant === "gradient",
            "bg-white/20 backdrop-blur-md border border-white/30 text-foreground hover:bg-white/30":
              variant === "glass",
            "border border-white/30 bg-transparent text-foreground hover:bg-white/10":
              variant === "outline",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GlassButton.displayName = "GlassButton";

export { GlassButton };
"use client";

import { useState } from "react";
import {
  GlassModal,
  GlassModalContent,
  GlassModalDescription,
  GlassModalFooter,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalTrigger,
} from "./glass-modal";
import { Button } from "./button";

export function GlassModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <GlassModal open={isOpen} onOpenChange={setIsOpen}>
      <GlassModalTrigger asChild>
        <Button variant="outline" className="glass-card hover-lift transition-glass">
          Open Glass Modal
        </Button>
      </GlassModalTrigger>
      <GlassModalContent className="sm:max-w-[425px]">
        <GlassModalHeader>
          <GlassModalTitle>Glassmorphic Modal</GlassModalTitle>
          <GlassModalDescription className="text-muted-foreground">
            This modal uses your app's existing color scheme with glassmorphic effects.
          </GlassModalDescription>
        </GlassModalHeader>
        <div className="grid gap-4 py-4">
          <div className="glass-card p-4 space-y-3">
            <h4 className="text-sm font-medium text-foreground">Your App Colors:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-muted-foreground">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <span className="text-muted-foreground">Secondary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span className="text-muted-foreground">Accent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-background border"></div>
                <span className="text-muted-foreground">Background</span>
              </div>
            </div>
          </div>
          <input 
            className="glass-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Glass input using app colors..."
          />
        </div>
        <GlassModalFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="transition-glass"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => setIsOpen(false)}
            className="btn-gradient"
          >
            Save Changes
          </Button>
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}
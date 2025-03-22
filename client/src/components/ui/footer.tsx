import * as React from "react";
import { Logo } from "@/components/ui/logo";

export function Footer({ className }: { className?: string }) {
  return (
    <div className={`${className} py-6`}>
      <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              EXL AI Solutions
            </a>
            . All rights reserved.
          </p>
        </div>
        <Logo />
      </div>
    </div>
  );
}
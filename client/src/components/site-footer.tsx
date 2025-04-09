import React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { ExternalLink } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} TripXL. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://www.exlservice.com/legal/terms-of-use"
            className="text-sm text-muted-foreground inline-flex items-center hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Terms <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <a
            href="https://www.exlservice.com/legal/privacy-policy"
            className="text-sm text-muted-foreground inline-flex items-center hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Privacy <ExternalLink className="ml-1 h-3 w-3" />
          </a>
          <ModeToggle />
        </div>
      </div>
    </footer>
  );
}
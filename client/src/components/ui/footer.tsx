import * as React from "react";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#004990] p-2 z-[9999]">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <Logo size="small" className="text-white h-5 w-5" />
          <p className="text-sm text-white font-medium">
            Powered by EXL AI Solutions
          </p>
        </div>
      </div>
    </div>
  );
}
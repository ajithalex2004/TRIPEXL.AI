import * as React from "react";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#004990]/90 p-2 flex justify-between items-center z-50">
      <div className="container mx-auto flex justify-between items-center">
        <p className="text-sm text-white font-medium">
          Powered by EXL AI Solutions
        </p>
        <div>
          <Logo size="default" className="text-white" />
        </div>
      </div>
    </div>
  );
}
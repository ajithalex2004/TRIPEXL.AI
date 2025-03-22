import * as React from "react";

export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#004990] h-12">
      <img 
        src="/attached_assets/image_1742621428346.png" 
        alt="EXL Logo" 
        className="absolute left-4 bottom-2 h-8 w-auto"
      />
      <p className="absolute right-4 bottom-0 h-12 flex items-center text-sm text-white font-medium">
        Powered by EXL AI Solutions
      </p>
    </div>
  );
}
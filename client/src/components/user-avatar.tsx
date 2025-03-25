import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  image?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const colorPalette = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-yellow-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-orange-500",
];

export function UserAvatar({ name, image, className, size = "md" }: UserAvatarProps) {
  // Generate consistent color based on name
  const colorIndex = React.useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % colorPalette.length;
  }, [name]);

  // Get initials from name
  const initials = React.useMemo(() => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [name]);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base"
  };

  return (
    <Avatar className={cn(sizeClasses[size], "relative", className)}>
      {image && <AvatarImage src={image} alt={name} />}
      <AvatarFallback 
        className={cn(
          "flex items-center justify-center font-semibold text-white transition-colors",
          colorPalette[colorIndex]
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

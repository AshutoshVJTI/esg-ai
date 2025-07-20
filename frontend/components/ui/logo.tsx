"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  variant?: "icon" | "text";
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ 
  variant = "text", 
  className = "", 
  width = 32, 
  height = 32 
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`animate-pulse bg-muted rounded ${className}`} style={{ width, height }} />;
  }

  const isDark = resolvedTheme === "dark" || theme === "dark";
  
  const logoSrc = variant === "icon" 
    ? (isDark ? "/images/reggie-logo-light.png" : "/images/reggie-logo-dark.png")
    : (isDark ? "/images/reggie-logo-text-light.png" : "/images/reggie-logo-text-dark.png");

  return (
    <Image
      src={logoSrc}
      alt="Reggie Logo"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority={variant === "text"}
    />
  );
} 
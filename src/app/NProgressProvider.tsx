// src/app/NProgressProvider.tsx
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import "./nprogress-custom.css";

export default function NProgressProvider() {
  const pathname = usePathname();

  useEffect(() => {
    // Start NProgress when pathname changes
    NProgress.start();

    // Slight delay to make sure bar is visible
    const timer = setTimeout(() => {
      NProgress.done();
    }, 500);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname]);

  return null;
}

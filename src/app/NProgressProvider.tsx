"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import "./nprogress-custom.css";

export default function NProgressProvider() {
  const pathname = usePathname();

  useEffect(() => {
    NProgress.configure({ 
      showSpinner: true,
      trickleSpeed: 200,
      minimum: 0.08
    });
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname]);

  return null;
}

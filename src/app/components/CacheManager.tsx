"use client";

import { useEffect } from "react";
import { getCacheManager } from "../lib/cache";

export default function CacheManager() {
  useEffect(() => {
    const cache = getCacheManager();
    cache.init().catch(console.error);

    const cleanupOldCache = async () => {
      try {
        const keys = await cache.getAllKeys();
        console.log(`Cache initialized with ${keys.length} entries`);
      } catch (error) {
        console.error("Error cleaning up cache:", error);
      }
    };

    cleanupOldCache();
  }, []);

  return null;
}

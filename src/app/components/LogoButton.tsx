"use client";

import { useCallback } from "react";
import Image from "next/image";

const LogoButton = () => {
  const handleClick = useCallback(() => {
    window.location.href = "/";
  }, []);

  return (
    <div onClick={handleClick} style={{ cursor: "pointer" }}>
      <Image
        src="/logo846.png"
        alt="Logo"
        width={68}
        height={80}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 1000,
        }}
      />
    </div>
  );
};

export default LogoButton;
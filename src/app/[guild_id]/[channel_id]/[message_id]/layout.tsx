"use client";

import { useEffect } from "react";

export default function DiscordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize Discord components
    if (typeof window !== "undefined") {
      import("@skyra/discord-components-core");
    }
  }, []);

  return <>{children}</>;
}

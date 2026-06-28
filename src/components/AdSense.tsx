"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

const adClient = process.env.NEXT_PUBLIC_ADSENSE_ID || "";

export function AdSenseScript() {
  if (!adClient) return null;
  return (
    <Script
      id="adsense"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}

type AdSlotProps = {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
};

export function AdSlot({ slot, format = "auto", className = "" }: AdSlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!adClient || initialized.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      if (w.adsbygoogle) {
        w.adsbygoogle.push({});
      }
    } catch {
      /* silent */
    }
    initialized.current = true;
  }, []);

  if (!adClient) return null;

  return (
    <div ref={ref} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={adClient}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

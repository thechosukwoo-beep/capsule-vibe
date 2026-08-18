"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { getGaMeasurementId } from "@/lib/site";

const GA_ID = getGaMeasurementId();

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== "function") {
      return;
    }

    if (previousPath.current === null) {
      previousPath.current = pathname;
      return;
    }

    if (previousPath.current === pathname) {
      return;
    }

    previousPath.current = pathname;
    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  useReportWebVitals((metric) => {
    if (!GA_ID || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", metric.name, {
      value: metric.name === "CLS" ? metric.delta * 1000 : metric.delta,
      event_category: "Web Vitals",
      event_label: metric.id,
      non_interaction: true,
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
    });
  });

  if (!GA_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

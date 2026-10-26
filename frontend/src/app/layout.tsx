import type { Metadata } from "next";
import "./globals.css";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { RouteTransition } from "@/components/layout/RouteTransition";
import { StairsPreloader } from "@/components/ui/StairsPreloader";

export const metadata: Metadata = {
  title: "RYDEXA — Micro-Mobility Demand Intelligence Platform",
  description: "Enterprise bike-sharing demand forecasting powered by verified empirical machine learning and real-time inference.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Applies the persisted (or system) theme BEFORE first paint to avoid
  // a flash of the wrong theme and hydration mismatches.
  const themeInitScript = `(function(){try{
    var t=localStorage.getItem('rydexa-theme');
    if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
    var d=document.documentElement;
    d.classList.toggle('dark',t==='dark');
    d.style.colorScheme=t;
    var m=localStorage.getItem('rydexa-motion');
    var full=m==='full'||(m!=='system'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    d.classList.toggle('motion-full',full);
  }catch(e){}})();`;

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <MotionProvider>
          {/* Root-level so it runs once per document and never replays when
              the visitor returns to the home route. */}
          <StairsPreloader />
          <RouteTransition>{children}</RouteTransition>
        </MotionProvider>
      </body>
    </html>
  );
}

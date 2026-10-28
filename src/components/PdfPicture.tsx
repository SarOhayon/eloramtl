"use client";

import { useEffect, useState } from "react";

// Shows the first page of a PDF as a still picture (no PDF viewer or scrolling).
// pdf.js is only loaded when a plan is opened.
export function PdfPicture({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback: React.ReactNode }) {
  const [state, setState] = useState<{ src: string; img?: string; failed?: boolean }>({ src });
  const current = state.src === src ? state : { src };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // The legacy build works in older browsers (e.g. Safari) too.
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
        const task = pdfjs.getDocument({ url: src });
        const doc = await task.promise;
        const page = await doc.getPage(1);
        const scale = 1800 / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvas, viewport }).promise;
        const img = canvas.toDataURL("image/png");
        void task.destroy();
        if (!cancelled) setState({ src, img });
      } catch (e) {
        console.warn("[plan] Could not show the PDF as a picture", e);
        if (!cancelled) setState({ src, failed: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (current.failed) return <>{fallback}</>;
  if (!current.img) return <div className="mx-auto aspect-[4/3] w-full max-w-2xl animate-pulse rounded-sm bg-cream-deep" aria-label={alt} />;
  // eslint-disable-next-line @next/next/no-img-element -- rendered from the PDF in the browser
  return <img src={current.img} alt={alt} className={className} />;
}

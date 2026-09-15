"use client";

import { useCallback, useRef, useState } from "react";
import { Check, Copy, Download, Link2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

/** Share + QR as a single segmented pill button. */
export function ShareQrGroup({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const onShare = useCallback(async () => {
    await writeClipboard(url);
    setCopied(true);
    setQrOpen(false);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const onDownloadQr = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const imgUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(imgUrl);
      canvas.toBlob((png) => {
        if (!png) return;
        const a = document.createElement("a");
        const pngUrl = URL.createObjectURL(png);
        const handle = url.split("/").filter(Boolean).pop() || "profile";
        a.href = pngUrl;
        a.download = `zynd-${handle}-qr.png`;
        a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
    };
    img.src = imgUrl;
  }, [url]);

  return (
    <div className="relative flex items-stretch">
      {/* Grouped pill */}
      <div className="inline-flex items-stretch rounded-full border border-[#DCDCD7] bg-white shadow-sm overflow-hidden">
        {/* Share half */}
        <button
          type="button"
          onClick={onShare}
          style={{ color: copied ? undefined : "#0B0B0B" }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px]! font-mono font-medium transition-all group
            ${copied ? "bg-emerald-500 text-white" : "hover:bg-black hover:text-white"}`}
        >
          {copied
            ? <Check size={14} />
            : <Link2 size={14} className="text-[#8E8E88] group-hover:text-white transition-colors" />
          }
          <span>{copied ? "Copied!" : "Share"}</span>
        </button>

        {/* Divider */}
        <span className="w-px bg-[#DCDCD7] self-stretch" />

        {/* QR half */}
        <button
          type="button"
          onClick={() => { setQrOpen(v => !v); setCopied(false); }}
          aria-expanded={qrOpen}
          aria-label="Show QR code"
          style={{ color: qrOpen ? undefined : "#0B0B0B" }}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12px]! font-mono font-medium transition-all group
            ${qrOpen ? "bg-black text-white" : "hover:bg-black hover:text-white"}`}
        >
          <QrCode size={14} className={`transition-colors ${qrOpen ? "text-white" : "text-[#8E8E88] group-hover:text-white"}`} />
          <span>QR</span>
        </button>
      </div>

      {/* QR popover */}
      {qrOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setQrOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-[#E5E5DE] rounded-2xl shadow-xl p-4 flex flex-col items-center gap-2.5">
            <div className="rounded-xl overflow-hidden border border-[#F0F0EA] p-2.5 bg-white leading-none">
              <QRCodeSVG ref={svgRef} value={url} size={136} fgColor="#0B0B0B" bgColor="#ffffff" level="M" marginSize={0} />
            </div>
            <span className="font-mono text-[10px] text-[#8E8E88] break-all max-w-[170px] text-center leading-snug">
              {url.replace(/^https?:\/\//, "")}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#7B72E9] font-bold">
              Scan to view profile
            </span>
            <button
              type="button"
              onClick={onDownloadQr}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black text-white hover:bg-[#333] transition-colors font-mono text-[10px]! font-semibold mt-0.5"
            >
              <Download size={12} />
              Download QR
            </button>
          </div>
        </>
      )}
    </div>
  );
}

async function writeClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/** Top-rail "Share" pill + adjacent "Copied!" toast. */
export function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(async () => {
    await writeClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        style={{ color: "#0B0B0B" }}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-black hover:!text-white border border-[#DCDCD7] text-[12px]! font-mono font-medium transition-all shadow-sm group"
      >
        <Link2 size={15} className="text-[#8E8E88] group-hover:text-white transition-colors" />
        <span>Share</span>
      </button>
      <span className={`transition-opacity duration-300 font-mono text-[11px] text-emerald-600 font-semibold ${copied ? "opacity-100" : "opacity-0"}`}>
        Copied!
      </span>
    </>
  );
}

/** Small icon-only copy button inside the "Zynd Verified" permalink row. */
export function CopyPermalinkIcon({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const onClick = useCallback(async () => {
    await writeClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded-xl transition-colors cursor-pointer ${copied ? "bg-black text-white" : "hover:bg-black hover:text-white text-[#8E8E88]"}`}
      title={copied ? "Copied!" : "Copy profile link"}
      aria-label={copied ? "Copied" : "Copy profile link"}
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

/** Top-rail "QR" pill + popover with a scannable code for the profile URL. */
export function QrButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Show QR code"
        style={{ color: "#0B0B0B" }}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-black hover:!text-white border border-[#DCDCD7] text-[12px]! font-mono font-medium transition-all shadow-sm group"
      >
        <QrCode size={15} className="text-[#8E8E88] group-hover:text-white transition-colors" />
        <span>QR</span>
      </button>
      {open && (
        <>
          {/* Invisible backdrop — click anywhere else closes the popover. */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-[#E5E5DE] rounded-2xl shadow-xl p-4 flex flex-col items-center gap-2.5">
            <div className="rounded-xl overflow-hidden border border-[#F0F0EA] p-2.5 bg-white leading-none">
              <QRCodeSVG value={url} size={136} fgColor="#0B0B0B" bgColor="#ffffff" level="M" marginSize={0} />
            </div>
            <span className="font-mono text-[10px] text-[#8E8E88] break-all max-w-[170px] text-center leading-snug">
              {url.replace(/^https?:\/\//, "")}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#7B72E9] font-bold">
              Scan to view profile
            </span>
          </div>
        </>
      )}
    </div>
  );
}

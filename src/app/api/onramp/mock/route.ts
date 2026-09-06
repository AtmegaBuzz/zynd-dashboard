import { NextResponse, type NextRequest } from "next/server";

// Renders a fake "Coinbase Pay" landing page for MOCK_ONRAMP=true mode.
// Counts down 8 seconds then closes the popup. The status route handles
// state progression server-side based on TopUp.createdAt.
export async function GET(req: NextRequest) {
  const ref = new URL(req.url).searchParams.get("partnerUserRef") ?? "";
  const html = `<!doctype html>
<html>
<head>
  <title>Mock Onramp</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0a; color: #fff;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .box { text-align: center; padding: 40px; border: 1px solid rgba(139,92,246,0.3);
           border-radius: 12px; max-width: 360px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px;
             background: rgba(255,184,0,0.12); color: #FFB800; font-size: 11px;
             font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 18px; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    p { font-size: 13px; color: rgba(255,255,255,0.55); margin: 0 0 18px; line-height: 1.5; }
    code { font-family: monospace; font-size: 11px; color: rgba(139,92,246,0.85); word-break: break-all; }
    .timer { font-size: 32px; font-weight: 700; margin: 14px 0; color: #00FF66; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">Mock Mode</div>
    <h1>Simulating Coinbase Pay</h1>
    <p>This window stands in for the real Coinbase popup. No funds move. The dashboard polling loop will mark the topup SUCCESS in a few seconds.</p>
    <div class="timer" id="t">8</div>
    <p>Ref: <code>${ref.replace(/[<>]/g, "")}</code></p>
  </div>
  <script>
    let n = 8;
    const el = document.getElementById("t");
    const i = setInterval(() => {
      n--;
      el.textContent = String(n);
      if (n <= 0) { clearInterval(i); window.close(); }
    }, 1000);
  </script>
</body>
</html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

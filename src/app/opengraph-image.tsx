import { ImageResponse } from "next/og";

export const alt = "PERICO — Inventory, POS & হিসাব for your business";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#131110",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* glow */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(212,162,58,0.35) 0%, rgba(19,17,16,0) 70%)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "#d4a23a",
              color: "#1c1917",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            P
          </div>
          <span style={{ color: "#f5f2ec", fontSize: 40, fontWeight: 700, letterSpacing: 2 }}>PERICO</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ color: "#f5f2ec", fontSize: 68, fontWeight: 700, lineHeight: 1.1 }}>
            Run your whole shop
          </span>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, color: "#d4a23a" }}>
            from one app
          </span>
          <span style={{ color: "#a8a29e", fontSize: 30, marginTop: 28, maxWidth: 900 }}>
            Inventory · Barcode POS · Sales · Purchasing · Dena–Paona ledger
          </span>
        </div>

        <span style={{ color: "#78716c", fontSize: 24 }}>perico-erp.vercel.app</span>
      </div>
    ),
    { ...size },
  );
}

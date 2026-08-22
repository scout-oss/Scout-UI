import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ kind: string; title: string }> },
) {
  const { kind, title } = await params;
  return new ImageResponse(
    <div
      style={{
        background: "#f7f2e7",
        color: "#111",
        display: "flex",
        flexDirection: "column",
        fontFamily: "sans-serif",
        height: "100%",
        justifyContent: "space-between",
        padding: "74px",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            background: "#c8ff26",
            border: "5px solid #111",
            boxShadow: "8px 8px 0 #111",
            fontSize: 28,
            fontWeight: 900,
            padding: "12px 22px",
            textTransform: "uppercase",
          }}
        >
          Scout UI
        </span>
        <span
          style={{ fontSize: 24, fontWeight: 800, textTransform: "uppercase" }}
        >
          {kind}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            background: "#7657ff",
            height: 18,
            transform: "rotate(-1deg)",
            width: 310,
          }}
        />
        <h1
          style={{
            fontSize: title.length > 34 ? 68 : 84,
            fontWeight: 950,
            letterSpacing: "-0.06em",
            lineHeight: 0.95,
            margin: 0,
            maxWidth: 1000,
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 28, margin: 0 }}>
          Accessible sticker-native React primitives · design.scoutapp.in
        </p>
      </div>
    </div>,
    { height: 630, width: 1200 },
  );
}

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const streak = searchParams.get("streak") || "0";
    const levelName = searchParams.get("levelName") || "Semence";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1e1b4b 0%, #31105f 50%, #430c70 100%)",
            fontFamily: "sans-serif",
            padding: "50px 60px",
            color: "#ffffff",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: "900",
                  letterSpacing: "2px",
                  background: "linear-gradient(to right, #ffffff, #c7d2fe)",
                  color: "#ffffff",
                }}
              >
                MannaDaily
              </span>
            </div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "3px",
              }}
            >
              Progression Quotidienne
            </span>
          </div>

          {/* Center Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "130px",
                fontWeight: "950",
                lineHeight: "1",
              }}
            >
              {streak} <span style={{ marginLeft: "15px" }}>🔥</span>
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#e2e8f0",
                marginTop: "15px",
                textTransform: "uppercase",
                letterSpacing: "4px",
                textAlign: "center",
              }}
            >
              jours de méditation biblique consécutifs
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(129, 140, 248, 0.2)",
              paddingTop: "25px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#a5b4fc",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Niveau Actuel
              </span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "900",
                  color: "#fb7185",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                🏆 {levelName}
              </span>
            </div>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#6366f1",
              }}
            >
              mannadaily.vercel.app
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

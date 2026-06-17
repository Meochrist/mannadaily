import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const badgeName = searchParams.get("badgeName") || "Pionnier";
    const badgeIcon = searchParams.get("badgeIcon") || "🏆";

    // Mappage d'icônes textuelles vers des émojis si besoin de fallback
    const iconEmoji = badgeIcon.length <= 4 ? badgeIcon : "🏆";

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
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #31105f 100%)",
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
                color: "#f43f5e",
                textTransform: "uppercase",
                letterSpacing: "3px",
              }}
            >
              Badge Obtenu !
            </span>
          </div>

          {/* Center Content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "10px",
            }}
          >
            {/* Badge Icon Container */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #ffe4e6 0%, #fda4af 100%)",
                border: "6px solid #fb7185",
                boxShadow: "0 10px 25px rgba(251, 113, 133, 0.4)",
                fontSize: "80px",
                marginBottom: "20px",
              }}
            >
              {iconEmoji}
            </div>

            <div
              style={{
                fontSize: "36px",
                fontWeight: "950",
                color: "#ffffff",
                textAlign: "center",
                letterSpacing: "1px",
              }}
            >
              {badgeName}
            </div>
            
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#94a3b8",
                marginTop: "10px",
                textTransform: "uppercase",
                letterSpacing: "3px",
                textAlign: "center",
              }}
            >
              J'ai obtenu ce badge sur MannaDaily !
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(244, 63, 94, 0.2)",
              paddingTop: "25px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#fda4af",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Croissance & Discipline
              </span>
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: "900",
                  color: "#cbd5e1",
                  letterSpacing: "1px",
                }}
              >
                🌱 Cultive ta foi quotidiennement
              </span>
            </div>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#f43f5e",
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

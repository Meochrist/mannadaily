import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const verseText = searchParams.get("verseText") || "Le Seigneur est mon berger, je ne manquerai de rien.";
    const reference = searchParams.get("reference") || "Psaume 23:1";
    const translation = searchParams.get("translation") || "LSG";

    // Gérer l'ajustement automatique de la taille du texte du verset
    let fontSize = "38px";
    if (verseText.length > 200) {
      fontSize = "26px";
    } else if (verseText.length > 120) {
      fontSize = "32px";
    }

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
            background: "linear-gradient(135deg, #1e1b4b 0%, #3c0c28 60%, #5f0f29 100%)",
            fontFamily: "sans-serif",
            padding: "60px 80px",
            color: "#ffffff",
            position: "relative",
          }}
        >
          {/* Border décorative */}
          <div
            style={{
              position: "absolute",
              top: "25px",
              bottom: "25px",
              left: "25px",
              right: "25px",
              border: "2px solid rgba(244, 63, 94, 0.25)",
              borderRadius: "24px",
              pointerEvents: "none",
            }}
          />

          {/* Header watermark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start",
              width: "100%",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#f43f5e",
                textTransform: "uppercase",
                letterSpacing: "3px",
              }}
            >
              MannaDaily • Partage Spirituel
            </span>
          </div>

          {/* Citation du verset centrée */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              maxWidth: "950px",
              margin: "auto 0",
              zIndex: 10,
            }}
          >
            {/* Guillemet ouvrant géant */}
            <span
              style={{
                fontSize: "120px",
                fontWeight: "900",
                color: "rgba(244, 63, 94, 0.15)",
                lineHeight: "0.1",
                marginBottom: "-20px",
                alignSelf: "flex-start",
              }}
            >
              “
            </span>

            <p
              style={{
                fontSize: fontSize,
                fontWeight: "800",
                textAlign: "center",
                lineHeight: "1.5",
                margin: "0 0 10px 0",
                fontStyle: "italic",
                color: "#f8fafc",
                letterSpacing: "-0.5px",
              }}
            >
              {verseText}
            </p>

            {/* Guillemet fermant géant */}
            <span
              style={{
                fontSize: "120px",
                fontWeight: "900",
                color: "rgba(244, 63, 94, 0.15)",
                lineHeight: "0.1",
                marginTop: "-20px",
                alignSelf: "flex-end",
              }}
            >
              ”
            </span>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(244, 63, 94, 0.2)",
              paddingTop: "20px",
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: "900",
                color: "#fda4af",
                letterSpacing: "1px",
              }}
            >
              📖 {reference} ({translation})
            </span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "rgba(244, 63, 94, 0.6)",
                letterSpacing: "1px",
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
    console.error("Error generating verse image:", e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}

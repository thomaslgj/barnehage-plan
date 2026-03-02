"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function InvitePage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (!code) return;

    // Try to open the app via deep link
    window.location.href = `flyt://onboarding?code=${encodeURIComponent(code)}`;

    // Fallback: redirect to landing page after a short delay
    const timeout = setTimeout(() => {
      window.location.href = "https://flytfamilie.no";
    }, 2000);

    return () => clearTimeout(timeout);
  }, [code]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Åpner Flyt...</h1>
        {code ? (
          <>
            <p style={styles.text}>
              Hvis appen ikke åpner seg automatisk, last ned Flyt og bruk denne koden:
            </p>
            <div style={styles.codeBox}>
              <span style={styles.codeLabel}>Invitasjonskode</span>
              <span style={styles.code}>{code}</span>
            </div>
            <a href="https://flytfamilie.no" style={styles.button}>
              Gå til flytfamilie.no
            </a>
          </>
        ) : (
          <p style={styles.text}>Ugyldig invitasjonslenke.</p>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2d2520",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "24px",
  },
  card: {
    backgroundColor: "#3d332d",
    borderRadius: "16px",
    padding: "40px 32px",
    maxWidth: "380px",
    width: "100%",
    textAlign: "center" as const,
  },
  heading: {
    color: "#f5f1ed",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 16px",
  },
  text: {
    color: "#a89985",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0 0 24px",
  },
  codeBox: {
    backgroundColor: "rgba(127, 168, 132, 0.15)",
    border: "2px solid rgba(127, 168, 132, 0.4)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  codeLabel: {
    color: "#7fa884",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "1px",
    textTransform: "uppercase" as const,
  },
  code: {
    color: "#f5f1ed",
    fontSize: "28px",
    fontWeight: "bold",
    letterSpacing: "2px",
  },
  button: {
    display: "block",
    backgroundColor: "#7fa884",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    padding: "12px 20px",
    borderRadius: "8px",
  },
};

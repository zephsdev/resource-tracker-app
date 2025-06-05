// theme.ts
// Use a lighter blue for mainBlue
export const mainBlue = "#60a5fa"; // Tailwind blue-400, lighter than before
export const darkBlue = "#2563eb"; // You can keep or lighten this as well
export const bgBlue = "#e0e7ff";   // Background blue for sections

export const fontFamily = "Inter, 'Segoe UI', Arial, sans-serif";

export const thStyle: React.CSSProperties = {
  // Gradient now goes from darkBlue (left) to mainBlue (right)
  background: `linear-gradient(90deg, ${darkBlue} 0%, ${mainBlue} 100%)`,
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  padding: "16px 0",
  textAlign: "center",
  borderBottom: "2px solid #e5e7eb",
  letterSpacing: 0.2,
  transition: "background 0.2s"
};

export const tdStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#222",
  background: "#fff",
  border: "none",
  padding: "10px 12px",
  textAlign: "center",
  verticalAlign: "middle",
  transition: "background 0.2s, box-shadow 0.2s"
};
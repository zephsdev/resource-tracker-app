// navigation.tsx
"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { mainBlue, darkBlue, bgBlue, fontFamily } from "../theme";

export default function Navigation() {
  const pathname = usePathname();
  const getLinkStyle = (path: string) => ({
    display: "block",
    padding: "12px 28px",
    color: "#fff",
    fontWeight: 700,
    fontFamily,
    textDecoration: "none",
    borderRadius: 8,
    letterSpacing: 0.5,
    background:
      pathname === path
        ? `linear-gradient(90deg, ${darkBlue} 0%, ${mainBlue} 100%)` // dark to light, left to right
        : "transparent",
    transition: "background 0.2s, color 0.2s",
  });

  return (
    <nav
      style={{
        width: 240,
        minHeight: "100vh",
        background: `linear-gradient(90deg, ${darkBlue} 0%, ${mainBlue} 100%)`, // dark to light, left to right
        borderRight: `2px solid ${darkBlue}`,
        padding: "40px 0 0 0",
        fontFamily,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: 26,
          color: "#fff",
          textAlign: "center",
          marginBottom: 40,
          letterSpacing: 2,
          textShadow: "0 2px 8px #1e40af",
        }}
      >
        Resource Tracker
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <li>
          <a href="/resources" style={getLinkStyle("/resources")}>
            Resources
          </a>
        </li>
        <li>
          <a href="/projects" style={getLinkStyle("/projects")}>
            Projects
          </a>
        </li>
        <li>
          <a href="/allocations" style={getLinkStyle("/allocations")}>
            Allocations
          </a>
        </li>
        <li>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8, // spacing between elements
              alignItems: "flex-start", // align links to the left
              padding: "4px 0 4px 0",
            }}
          >
            <a href="/assign" style={getLinkStyle("/assign")}>
              Assign
            </a>
            {/* Example: add more assign-related links here if needed */}
            {/* <a href="/assign/other" style={getLinkStyle("/assign/other")}>Other Assign</a> */}
          </div>
        </li>
        <li>
          <a href="/report" style={getLinkStyle("/report")}>
            Report
          </a>
        </li>
      </ul>
    </nav>
  );
}
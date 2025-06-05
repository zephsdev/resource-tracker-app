'use client';
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import Navigation from "../components/navigation";
import { mainBlue, fontFamily } from "../theme";

interface Allocation {
  id: string;
  resource_id: string;
  project_id: string;
  end_date: string | null;
  resources: { name: string } | null;
  projects: { name: string } | null;
}

interface Resource {
  id: string;
  name: string;
}

type SortKey = "resource" | "projects" | "lastDay";
type SortDirection = "asc" | "desc";

export default function ReportPage() {
  const [rows, setRows] = useState<
    { resource: string; projects: string; lastDay: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // Search, filter, sort state
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<"" | "available" | "not-available">("");
  const [sortKey, setSortKey] = useState<SortKey>("resource");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // For project filter dropdown
  const projectOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => r.projects.split(", ").forEach(p => p && set.add(p)));
    return Array.from(set).sort();
  }, [rows]);

  useEffect(() => {
    const fetchReport = async () => {
      // Fetch all resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from("resources")
        .select("id, name");
      if (resourcesError) {
        setError(resourcesError.message);
        return;
      }

      // Fetch all allocations with project/resource info
      const { data: allocationsData, error: allocationsError } = await supabase
        .from("allocations")
        .select(`
          id,
          end_date,
          resource_id,
          project_id,
          resources (
            name
          ),
          projects (
            name
          )
        `);

      if (allocationsError) {
        setError(allocationsError.message);
        return;
      }

      // Group allocations by resource_id
      const byResource: Record<string, { projects: Set<string>; lastDay: string | null }> = {};
      (allocationsData ?? []).forEach((a: any) => {
        const rid = a.resource_id;
        if (!byResource[rid]) {
          byResource[rid] = { projects: new Set(), lastDay: null };
        }
        if (a.projects?.name) byResource[rid].projects.add(a.projects.name);
        if (a.end_date && (!byResource[rid].lastDay || a.end_date > byResource[rid].lastDay)) {
          byResource[rid].lastDay = a.end_date;
        }
      });

      // Build rows for all resources
      const allRows = (resourcesData ?? []).map((r: Resource) => {
        const alloc = byResource[r.id];
        return {
          resource: r.name,
          projects: alloc ? Array.from(alloc.projects).join(", ") : "",
          lastDay: alloc && alloc.lastDay ? alloc.lastDay : "available",
        };
      });

      setRows(allRows);
    };
    fetchReport();
  }, []);

  // Filter, search, and sort rows
  const filteredRows = useMemo(() => {
    let result = rows;

    // Search by resource or project
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(
        r =>
          r.resource.toLowerCase().includes(s) ||
          r.projects.toLowerCase().includes(s)
      );
    }

    // Filter by project
    if (projectFilter) {
      result = result.filter(r =>
        r.projects.split(", ").includes(projectFilter)
      );
    }

    // Filter by availability
    if (availabilityFilter === "available") {
      result = result.filter(r => r.lastDay === "available");
    } else if (availabilityFilter === "not-available") {
      result = result.filter(r => r.lastDay !== "available");
    }

    // Sort
    result = [...result].sort((a, b) => {
      let vA = a[sortKey];
      let vB = b[sortKey];
      if (sortKey === "lastDay") {
        // "available" should always be last in desc, first in asc
        if (vA === "available") return sortDir === "asc" ? -1 : 1;
        if (vB === "available") return sortDir === "asc" ? 1 : -1;
      }
      if (vA < vB) return sortDir === "asc" ? -1 : 1;
      if (vA > vB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [rows, search, projectFilter, availabilityFilter, sortKey, sortDir]);

  // Sort header click handler
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily }}>
      <Navigation />
      <main style={{ marginLeft: 240, width: "100%", padding: 40 }}>
        <h1 style={{ color: mainBlue, fontWeight: 800, fontSize: 32, marginBottom: 32 }}>
          Resource Allocation Report
        </h1>
        {/* Search and filter row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 24, alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search resource or project..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 15,
              fontFamily,
              minWidth: 220,
              outline: "none"
            }}
          />
          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 15,
              fontFamily,
              minWidth: 180,
              outline: "none"
            }}
          >
            <option value="">All projects</option>
            {projectOptions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={e => setAvailabilityFilter(e.target.value as "" | "available" | "not-available")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 15,
              fontFamily,
              minWidth: 160,
              outline: "none"
            }}
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="not-available">Not available</option>
          </select>
        </div>
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px 0 rgba(37,99,235,0.06)",
          overflow: "hidden"
        }}>
          <thead>
            <tr style={{ background: "#e0e7ef" }}>
              <th
                style={{ textAlign: "left", padding: 14, fontWeight: 700, color: mainBlue, cursor: "pointer" }}
                onClick={() => handleSort("resource")}
              >
                Resource {sortKey === "resource" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                style={{ textAlign: "left", padding: 14, fontWeight: 700, color: mainBlue, cursor: "pointer" }}
                onClick={() => handleSort("projects")}
              >
                Projects {sortKey === "projects" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
              <th
                style={{ textAlign: "left", padding: 14, fontWeight: 700, color: mainBlue, cursor: "pointer" }}
                onClick={() => handleSort("lastDay")}
              >
                Last Day {sortKey === "lastDay" ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={row.resource} style={{ background: idx % 2 === 0 ? "#f3f4f6" : "#fff" }}>
                <td style={{ padding: 14, fontWeight: 600 }}>{row.resource}</td>
                <td style={{ padding: 14 }}>{row.projects}</td>
                <td style={{ padding: 14 }}>{row.lastDay}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
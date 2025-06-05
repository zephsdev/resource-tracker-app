"use client";
import React, { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import Navigation from "../components/navigation";
import { mainBlue, darkBlue, bgBlue, thStyle, tdStyle, fontFamily } from "../theme";

type Project = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  description?: string;
};

type SortKey = "name" | "start_date" | "end_date" | "description";
type SortDirection = "asc" | "desc";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // For editing
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // Filter dropdowns
  const [filterStartMin, setFilterStartMin] = useState("");
  const [filterStartMax, setFilterStartMax] = useState("");
  const [filterEndMin, setFilterEndMin] = useState("");
  const [filterEndMax, setFilterEndMax] = useState("");

  // Fetch projects from Supabase
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").order("name");
    if (error) setError(error.message);
    else setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Get unique start and end dates for dropdowns (could be improved for real use)
  const uniqueStartDates = Array.from(new Set(projects.map(p => p.start_date))).filter(Boolean);
  const uniqueEndDates = Array.from(new Set(projects.map(p => p.end_date))).filter(Boolean);

  // Filtered projects by search and dropdowns
  const filteredProjects = projects.filter(p => {
    const nameMatch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());

    const startDateOk =
      (!filterStartMin || p.start_date >= filterStartMin) &&
      (!filterStartMax || p.start_date <= filterStartMax);

    const endDateOk =
      (!filterEndMin || p.end_date >= filterEndMin) &&
      (!filterEndMax || p.end_date <= filterEndMax);

    return nameMatch && startDateOk && endDateOk;
  });

  // Sort filtered projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aVal = a[sortKey] || "";
    let bVal = b[sortKey] || "";
    if (sortKey === "start_date" || sortKey === "end_date") {
      aVal = aVal as string;
      bVal = bVal as string;
      if (sortDir === "asc") return aVal.localeCompare(bVal);
      else return bVal.localeCompare(aVal);
    } else {
      aVal = (aVal as string).toLowerCase();
      bVal = (bVal as string).toLowerCase();
      if (sortDir === "asc") return aVal.localeCompare(bVal);
      else return bVal.localeCompare(aVal);
    }
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(dir => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const addProject = async () => {
    if (!projectName.trim() || !startDate || !endDate) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .insert([{ name: projectName.trim(), start_date: startDate, end_date: endDate, description: description.trim() }])
      .select();
    if (error) {
      setError(error.message);
    }
    if (!error && data) setProjects(prev => [...prev, ...data]);
    setProjectName("");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setLoading(false);
  };

  const removeProject = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) setProjects(prev => prev.filter(p => p.id !== id));
    setLoading(false);
  };

  const startEdit = (project: Project) => {
    setEditId(project.id);
    setEditName(project.name);
    setEditStart(project.start_date);
    setEditEnd(project.end_date);
    setEditDesc(project.description || "");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditStart("");
    setEditEnd("");
    setEditDesc("");
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim() || !editStart || !editEnd) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .update({ name: editName.trim(), start_date: editStart, end_date: editEnd, description: editDesc.trim() })
      .eq("id", editId)
      .select();
    if (error) setError(error.message);
    if (!error && data) {
      setProjects(prev =>
        prev.map(p => (p.id === editId ? data[0] : p))
      );
      cancelEdit();
    }
    setLoading(false);
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${mainBlue} 0%, ${bgBlue} 100%)`,
      fontFamily
    }}>
      <Navigation />
      <main style={{
        marginLeft: 240,
        width: "100%",
        minHeight: "100vh",
        margin: 0,
        padding: 40,
        background: "rgba(255,255,255,0.96)",
        borderRadius: 0,
        boxShadow: "none",
        overflowX: "auto"
      }}>
        <h2 style={{
          textAlign: "center",
          marginBottom: 32,
          color: mainBlue,
          fontWeight: 800,
          letterSpacing: 1,
          fontSize: 32,
          textShadow: "0 2px 8px #e0e7ff"
        }}>Manage Projects</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            addProject();
          }}
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 32,
            flexWrap: "wrap",
            alignItems: "center",
            background: "#e0e7ff",
            padding: 18,
            borderRadius: 12,
            boxShadow: "0 1px 4px 0 rgba(37,99,235,0.08)"
          }}
        >
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="Project name"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 16,
              flex: "1 1 160px",
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          />
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            placeholder="Start date"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 16,
              flex: "1 1 120px",
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          />
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            placeholder="End date"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 16,
              flex: "1 1 120px",
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          />
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 16,
              flex: "2 1 220px",
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          />
          <button
            type="submit"
            disabled={loading || !projectName.trim() || !startDate || !endDate}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              fontFamily,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 1px 4px 0 rgba(37,99,235,0.10)",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Processing..." : "Add Project"}
          </button>
        </form>

        {/* Search and filter section */}
        <div style={{
          display: "flex",
          gap: 14,
          marginBottom: 18,
          flexWrap: "wrap",
          alignItems: "center",
          background: "#e0e7ff",
          padding: 18,
          borderRadius: 12,
          boxShadow: "0 1px 4px 0 rgba(37,99,235,0.08)"
        }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or description"
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              fontSize: 15,
              width: 280,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          />
          <span style={{ fontWeight: 600, color: mainBlue, fontFamily }}>Start:</span>
          <input
            type="date"
            value={filterStartMin}
            onChange={e => setFilterStartMin(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
            placeholder="From"
          />
          <input
            type="date"
            value={filterStartMax}
            onChange={e => setFilterStartMax(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
            placeholder="To"
          />
          <span style={{ fontWeight: 600, color: mainBlue, fontFamily }}>End:</span>
          <input
            type="date"
            value={filterEndMin}
            onChange={e => setFilterEndMin(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
            placeholder="From"
          />
          <input
            type="date"
            value={filterEndMax}
            onChange={e => setFilterEndMax(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
            placeholder="To"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                padding: 10,
                borderRadius: 8,
                border: "none",
                background: "#e5e7eb",
                color: "#333",
                fontWeight: 500,
                fontSize: 15,
                cursor: "pointer"
              }}
            >
              Clear Search
            </button>
          )}
        </div>

        {error && <p style={{ color: "#dc2626", marginBottom: 16 }}>Error: {error}</p>}

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            width: "100%",
            minWidth: 800,
            background: mainBlue,
            borderRadius: 18,
            boxShadow: "0 2px 16px 0 rgba(37,99,235,0.12)",
            margin: "0 auto",
            fontFamily
          }}>
            <thead>
              <tr>
                <th
                  style={{
                    ...thStyle,
                    cursor: "pointer",
                    userSelect: "none",
                    background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                    color: "#fff",
                    borderTopLeftRadius: 18
                  }}
                  onClick={() => handleSort("name")}
                  title="Sort by project name"
                >
                  Name&nbsp;
                  <span style={{ fontSize: 14 }}>
                    {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </span>
                </th>
                <th
                  style={{
                    ...thStyle,
                    cursor: "pointer",
                    userSelect: "none",
                    background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                    color: "#fff"
                  }}
                  onClick={() => handleSort("start_date")}
                  title="Sort by start date"
                >
                  Start Date&nbsp;
                  <span style={{ fontSize: 14 }}>
                    {sortKey === "start_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </span>
                </th>
                <th
                  style={{
                    ...thStyle,
                    cursor: "pointer",
                    userSelect: "none",
                    background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                    color: "#fff"
                  }}
                  onClick={() => handleSort("end_date")}
                  title="Sort by end date"
                >
                  End Date&nbsp;
                  <span style={{ fontSize: 14 }}>
                    {sortKey === "end_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </span>
                </th>
                <th
                  style={{
                    ...thStyle,
                    cursor: "pointer",
                    userSelect: "none",
                    background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                    color: "#fff"
                  }}
                  onClick={() => handleSort("description")}
                  title="Sort by description"
                >
                  Description&nbsp;
                  <span style={{ fontSize: 14 }}>
                    {sortKey === "description" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </span>
                </th>
                <th style={{
                  ...thStyle,
                  background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                  color: "#fff",
                  borderTopRightRadius: 18
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProjects.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#888", padding: 24, background: "#fff" }}>
                    No projects found.
                  </td>
                </tr>
              )}
              {sortedProjects.map(project => (
                <tr key={project.id} style={{ background: "#fff" }}>
                  {editId === project.id ? (
                    <>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          style={{
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
                            width: "100%",
                            background: "#fff",
                            color: mainBlue,
                            fontWeight: 600,
                            fontFamily
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="date"
                          value={editStart}
                          onChange={e => setEditStart(e.target.value)}
                          style={{
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
                            width: "100%",
                            background: "#fff",
                            color: mainBlue,
                            fontWeight: 600,
                            fontFamily
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="date"
                          value={editEnd}
                          onChange={e => setEditEnd(e.target.value)}
                          style={{
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
                            width: "100%",
                            background: "#fff",
                            color: mainBlue,
                            fontWeight: 600,
                            fontFamily
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                          style={{
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
                            width: "100%",
                            background: "#fff",
                            color: mainBlue,
                            fontWeight: 600,
                            fontFamily
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={saveEdit}
                            disabled={loading || !editName.trim() || !editStart || !editEnd}
                            style={{
                              background: "#22c55e",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 18px",
                              fontWeight: 700,
                              cursor: loading ? "not-allowed" : "pointer",
                              fontSize: 15,
                              fontFamily,
                              boxShadow: "0 1px 4px 0 rgba(37,99,235,0.10)",
                              transition: "background 0.2s"
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            type="button"
                            style={{
                              background: "#e5e7eb",
                              color: "#222",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 18px",
                              fontWeight: 700,
                              fontSize: 15,
                              fontFamily
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{
                        ...tdStyle,
                        color: mainBlue,
                        fontWeight: 700
                      }}>{project.name}</td>
                      <td style={{
                        ...tdStyle,
                        color: darkBlue,
                        fontWeight: 600
                      }}>{project.start_date}</td>
                      <td style={{
                        ...tdStyle,
                        color: darkBlue,
                        fontWeight: 600
                      }}>{project.end_date}</td>
                      <td style={{
                        ...tdStyle,
                        color: darkBlue,
                        fontWeight: 600
                      }}>{project.description}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => startEdit(project)}
                          disabled={loading}
                          style={{
                            background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 18px",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: 15,
                            fontFamily,
                            marginRight: 8,
                            boxShadow: "0 1px 4px 0 rgba(37,99,235,0.10)",
                            transition: "background 0.2s"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeProject(project.id)}
                          disabled={loading}
                          style={{
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 18px",
                            fontWeight: 700,
                            cursor: loading ? "not-allowed" : "pointer",
                            fontSize: 15,
                            fontFamily,
                            boxShadow: "0 1px 4px 0 rgba(37,99,235,0.10)",
                            transition: "background 0.2s"
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
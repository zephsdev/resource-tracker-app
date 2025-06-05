"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Navigation from "../components/navigation";
import { mainBlue, darkBlue, bgBlue, thStyle, tdStyle, fontFamily } from "../theme";

type Allocation = {
  id: string;
  resource_id: string;
  project_id: string;
  start_date: string;
  end_date: string;
  resources?: { name: string } | { name: string }[] | null;
  projects?: { name: string } | { name: string }[] | null;
};

type SortKey = "resource" | "project" | "start_date" | "end_date";
type SortDirection = "asc" | "desc";

export default function AssignAllocationPage() {
  const [resources, setResources] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedResource, setSelectedResource] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For editing
  const [editId, setEditId] = useState<string | null>(null);
  const [editResource, setEditResource] = useState("");
  const [editProject, setEditProject] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("resource");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  useEffect(() => {
    const fetchData = async () => {
      const { data: resData } = await supabase.from("resources").select("id, name");
      setResources(resData || []);
      const { data: projData } = await supabase.from("projects").select("id, name");
      setProjects(projData || []);
      const { data: allocData } = await supabase
        .from("allocations")
        .select("id, resource_id, project_id, start_date, end_date, resources(name), projects(name)");
      setAllocations(allocData ?? []);
    };
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedResource || !selectedProject || !startDate || !endDate) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from("allocations").insert([
      {
        resource_id: selectedResource,
        project_id: selectedProject,
        start_date: startDate,
        end_date: endDate
      }
    ]);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Allocation assigned successfully!");
      setSelectedResource("");
      setSelectedProject("");
      setStartDate("");
      setEndDate("");
      // Refresh allocations
      const { data: allocData } = await supabase
        .from("allocations")
        .select("id, resource_id, project_id, start_date, end_date, resources(name), projects(name)");
      setAllocations(allocData ?? []);
    }
  };

  // Edit helpers
  const startEdit = (alloc: Allocation) => {
    setEditId(alloc.id);
    setEditResource(alloc.resource_id);
    setEditProject(alloc.project_id);
    setEditStart(alloc.start_date);
    setEditEnd(alloc.end_date);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditResource("");
    setEditProject("");
    setEditStart("");
    setEditEnd("");
  };

  const saveEdit = async () => {
    if (!editId || !editResource || !editProject || !editStart || !editEnd) return;
    setLoading(true);
    const { error } = await supabase
      .from("allocations")
      .update({
        resource_id: editResource,
        project_id: editProject,
        start_date: editStart,
        end_date: editEnd
      })
      .eq("id", editId);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Allocation updated!");
      cancelEdit();
      // Refresh allocations
      const { data: allocData } = await supabase
        .from("allocations")
        .select("id, resource_id, project_id, start_date, end_date, resources(name), projects(name)");
      setAllocations(allocData ?? []);
    }
  };

  const removeAlloc = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("allocations").delete().eq("id", id);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Allocation removed.");
      // Refresh allocations
      const { data: allocData } = await supabase
        .from("allocations")
        .select("id, resource_id, project_id, start_date, end_date, resources(name), projects(name)");
      setAllocations(allocData ?? []);
    }
  };

  // Sorting logic
  const sortedAllocations = [...allocations].sort((a, b) => {
    let aVal = "";
    let bVal = "";
    if (sortKey === "resource") {
      aVal = Array.isArray(a.resources) ? a.resources[0]?.name || "" : a.resources?.name || "";
      bVal = Array.isArray(b.resources) ? b.resources[0]?.name || "" : b.resources?.name || "";
    } else if (sortKey === "project") {
      aVal = Array.isArray(a.projects) ? a.projects[0]?.name || "" : a.projects?.name || "";
      bVal = Array.isArray(b.projects) ? b.projects[0]?.name || "" : b.projects?.name || "";
    } else if (sortKey === "start_date" || sortKey === "end_date") {
      aVal = a[sortKey] || "";
      bVal = b[sortKey] || "";
    }
    if (sortDir === "asc") return aVal.localeCompare(bVal);
    else return bVal.localeCompare(aVal);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(dir => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
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
          color: mainBlue,
          marginBottom: 32,
          fontWeight: 800,
          letterSpacing: 1,
          fontSize: 32,
          textShadow: "0 2px 8px #e0e7ff"
        }}>Assign Resource to Project</h2>
        <form
          onSubmit={handleAssign}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 28px", // Reduce row gap to 12px, keep column gap at 28px
            width: "100%",
            minWidth: 600,
            background: "#e0e7ff",
            padding: 24,
            borderRadius: 12,
            boxShadow: "0 1px 4px 0 rgba(37,99,235,0.08)",
            marginBottom: 32,
            alignItems: "end"
          }}
        >
          <label style={{
            fontWeight: 600,
            color: mainBlue,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6
          }}>
            Resource:
            <select
              value={selectedResource}
              onChange={e => setSelectedResource(e.target.value)}
              style={{
                minWidth: 0,
                width: 360, // Double the previous width (180 * 2)
                padding: 10,
                borderRadius: 8,
                border: `1.5px solid ${mainBlue}`,
                fontSize: 16,
                marginTop: 4,
                background: "#fff",
                color: mainBlue,
                fontWeight: 600,
                fontFamily
              }}
              required
            >
              <option value="">Select resource</option>
              {resources.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label style={{
            fontWeight: 600,
            color: mainBlue,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6
          }}>
            Project:
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{
                minWidth: 0,
                width: 360, // Double the previous width (180 * 2)
                padding: 10,
                borderRadius: 8,
                border: `1.5px solid ${mainBlue}`,
                fontSize: 16,
                marginTop: 4,
                background: "#fff",
                color: mainBlue,
                fontWeight: 600,
                fontFamily
              }}
              required
            >
              <option value="">Select project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label style={{
            fontWeight: 600,
            color: mainBlue,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6
          }}>
            Start Date:
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                minWidth: 0,
                width: 320, // Double the previous width (160 * 2)
                padding: 10,
                borderRadius: 8,
                border: `1.5px solid ${mainBlue}`,
                fontSize: 16,
                marginTop: 4,
                background: "#fff",
                color: mainBlue,
                fontWeight: 600,
                fontFamily
              }}
              required
            />
          </label>
          <label style={{
            fontWeight: 600,
            color: mainBlue,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6
          }}>
            End Date:
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                minWidth: 0,
                width: 320, // Double the previous width (160 * 2)
                padding: 10,
                borderRadius: 8,
                border: `1.5px solid ${mainBlue}`,
                fontSize: 16,
                marginTop: 4,
                background: "#fff",
                color: mainBlue,
                fontWeight: 600,
                fontFamily
              }}
              required
            />
          </label>
          <div style={{ gridColumn: "1 / span 2", marginTop: 10 }}>
            <button
              type="submit"
              disabled={loading}
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
              {loading ? "Assigning..." : "Assign"}
            </button>
            {error && <div style={{ color: "#dc2626", marginTop: 8 }}>{error}</div>}
            {success && <div style={{ color: "#22c55e", marginTop: 8 }}>{success}</div>}
          </div>
        </form>

        {/* Allocations Table */}
        <div style={{ width: "100%" }}> {/* REMOVE maxWidth */}
          <h3 style={{ marginBottom: 16, color: mainBlue }}>Current Allocations</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", // fill all available width
              borderCollapse: "separate",
              borderSpacing: 0,
              background: mainBlue,
              borderRadius: 18,
              boxShadow: "0 2px 16px 0 rgba(37,99,235,0.12)",
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
                    onClick={() => handleSort("resource")}
                  >
                    Resource&nbsp;
                    <span style={{ fontSize: 14 }}>
                      {sortKey === "resource" ? (sortDir === "asc" ? "▲" : "▼") : ""}
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
                    onClick={() => handleSort("project")}
                  >
                    Project&nbsp;
                    <span style={{ fontSize: 14 }}>
                      {sortKey === "project" ? (sortDir === "asc" ? "▲" : "▼") : ""}
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
                      color: "#fff",
                      borderTopRightRadius: 18
                    }}
                    onClick={() => handleSort("end_date")}
                  >
                    End Date&nbsp;
                    <span style={{ fontSize: 14 }}>
                      {sortKey === "end_date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </th>
                  <th style={{
                    ...thStyle,
                    background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                    color: "#fff"
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAllocations.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#888", padding: 24, background: "#fff" }}>
                      No allocations found.
                    </td>
                  </tr>
                )}
                {sortedAllocations.map(alloc =>
                  editId === alloc.id ? (
                    <tr key={alloc.id} style={{ background: "#fff" }}>
                      <td style={tdStyle}>
                        <select
                          value={editResource}
                          onChange={e => setEditResource(e.target.value)}
                          style={{
                            width: "100%",
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
                            background: "#fff",
                            color: mainBlue,
                            fontWeight: 600,
                            fontFamily
                          }}
                        >
                          <option value="">Select resource</option>
                          {resources.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <select
                          value={editProject}
                          onChange={e => setEditProject(e.target.value)}
                          style={{
                            width: "100%",
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
                            background: "#fff",
                            color: mainBlue,
                            fontWeight: 600,
                            fontFamily
                          }}
                        >
                          <option value="">Select project</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input
                          type="date"
                          value={editStart}
                          onChange={e => setEditStart(e.target.value)}
                          style={{
                            width: "100%",
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
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
                            width: "100%",
                            padding: 8,
                            borderRadius: 4,
                            border: `1.5px solid ${mainBlue}`,
                            fontSize: 15,
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
                            disabled={loading || !editResource || !editProject || !editStart || !editEnd}
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
                    </tr>
                  ) : (
                    <tr key={alloc.id} style={{ background: "#fff" }}>
                      <td style={{
                        ...tdStyle,
                        color: mainBlue,
                        fontWeight: 700
                      }}>{Array.isArray(alloc.resources) ? alloc.resources[0]?.name : alloc.resources?.name}</td>
                      <td style={tdStyle}>
                        {Array.isArray(alloc.projects)
                          ? alloc.projects[0]?.name
                          : alloc.projects?.name}
                      </td>
                      <td style={{
                        ...tdStyle,
                        color: darkBlue,
                        fontWeight: 600
                      }}>{alloc.start_date}</td>
                      <td style={{
                        ...tdStyle,
                        color: darkBlue,
                        fontWeight: 600
                      }}>{alloc.end_date}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => startEdit(alloc)}
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
                          onClick={() => removeAlloc(alloc.id)}
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
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
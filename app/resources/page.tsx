"use client";
import React, { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import Navigation from "../components/navigation";
import { mainBlue, darkBlue, bgBlue, thStyle, tdStyle, fontFamily } from "../theme";

type Resource = {
  id: string;
  name: string;
  department: string;
  role: string;
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<"name" | "department" | "role">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // For filters and search
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // For adding a resource
  const [resourceName, setResourceName] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");

  // For editing a resource
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const [editRole, setEditRole] = useState("");

  // Fetch resources from Supabase
  const fetchResources = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("resources").select("*").order("name");
    if (error) setError(error.message);
    if (data) setResources(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const addResource = async () => {
    if (!resourceName.trim() || !department.trim() || !role.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .insert([{ name: resourceName.trim(), department: department.trim(), role: role.trim() }])
      .select();
    if (error) setError(error.message);
    if (data) setResources(prev => [...prev, ...data]);
    setResourceName("");
    setDepartment("");
    setRole("");
    setLoading(false);
  };

  const deleteResource = async (id: string) => {
    setLoading(true);
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (!error) setResources(prev => prev.filter(r => r.id !== id));
    setLoading(false);
  };

  const startEdit = (resource: Resource) => {
    setEditId(resource.id);
    setEditName(resource.name);
    setEditDepartment(resource.department);
    setEditRole(resource.role);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditDepartment("");
    setEditRole("");
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim() || !editDepartment.trim() || !editRole.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("resources")
      .update({ name: editName.trim(), department: editDepartment.trim(), role: editRole.trim() })
      .eq("id", editId)
      .select();
    if (error) setError(error.message);
    if (!error && data) {
      setResources(prev =>
        prev.map(r => (r.id === editId ? data[0] : r))
      );
      cancelEdit();
    }
    setLoading(false);
  };

  // Get unique departments and roles for filter dropdowns
  const departments = Array.from(new Set(resources.map(r => r.department))).filter(Boolean);
  const roles = Array.from(new Set(resources.map(r => r.role))).filter(Boolean);

  // Filter and search logic
  const filteredResources = resources.filter(r =>
    (!filterDepartment || r.department === filterDepartment) &&
    (!filterRole || r.role === filterRole) &&
    ((r.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.department || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.role || "").toLowerCase().includes(search.toLowerCase()))
  );

  // Sort filtered resources by selected key
  const sortedResources = [...filteredResources].sort((a, b) => {
    let aVal = a[sortKey] || "";
    let bVal = b[sortKey] || "";
    if (sortAsc) return aVal.localeCompare(bVal);
    else return bVal.localeCompare(aVal);
  });

  // Helper for rendering sort arrow
  const renderSortArrow = (key: "name" | "department" | "role") =>
    sortKey === key ? (
      <span style={{ fontSize: 14 }}>{sortAsc ? "▲" : "▼"}</span>
    ) : null;

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
        }}>Resources</h2>
        
        {/* --- Move the form above the search/filter section --- */}
        <form
          onSubmit={e => { e.preventDefault(); addResource(); }}
          style={{
            display: "flex",
            gap: 14,
            marginBottom: 28,
            flexWrap: "wrap",
            background: "#e0e7ff", // Changed to match the search/filter section
            padding: 18,
            borderRadius: 12,
            boxShadow: "0 1px 4px 0 rgba(37,99,235,0.08)"
          }}
        >
          <input
            type="text"
            placeholder="Resource name"
            value={resourceName}
            onChange={e => setResourceName(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
            required
          />
          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={e => setDepartment(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
            required
          />
          <input
            type="text"
            placeholder="Role"
            value={role}
            onChange={e => setRole(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
            required
          />
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
            Add
          </button>
        </form>
        <div style={{
          marginBottom: 28,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          background: "#e0e7ff",
          padding: 18,
          borderRadius: 12,
          boxShadow: "0 1px 4px 0 rgba(37,99,235,0.08)"
        }}>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              minWidth: 200,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          />
          <select
            value={filterDepartment}
            onChange={e => setFilterDepartment(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          >
            <option value="">All Departments</option>
            {departments.map(dep => (
              <option key={dep} value={dep}>{dep}</option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 8,
              border: `1.5px solid ${mainBlue}`,
              background: "#fff",
              color: mainBlue,
              fontWeight: 600,
              fontFamily
            }}
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}
        <div style={{ overflowX: "auto" }}>
          <table style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            width: "100%",
            minWidth: 600,
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
                  onClick={() => {
                    if (sortKey === "name") setSortAsc(a => !a);
                    else { setSortKey("name"); setSortAsc(true); }
                  }}
                  title="Sort by resource name"
                >
                  Name&nbsp;{renderSortArrow("name")}
                </th>
                <th
                  style={{
                    ...thStyle,
                    cursor: "pointer",
                    userSelect: "none",
                    background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                    color: "#fff"
                  }}
                  onClick={() => {
                    if (sortKey === "department") setSortAsc(a => !a);
                    else { setSortKey("department"); setSortAsc(true); }
                  }}
                  title="Sort by department"
                >
                  Department&nbsp;{renderSortArrow("department")}
                </th>
                <th
                  style={{
                    ...thStyle,
                    cursor: "pointer",
                    userSelect: "none",
                    background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                    color: "#fff"
                  }}
                  onClick={() => {
                    if (sortKey === "role") setSortAsc(a => !a);
                    else { setSortKey("role"); setSortAsc(true); }
                  }}
                  title="Sort by role"
                >
                  Role&nbsp;{renderSortArrow("role")}
                </th>
                <th style={{
                  ...thStyle,
                  background: `linear-gradient(90deg, ${mainBlue} 60%, ${darkBlue} 100%)`,
                  color: "#fff",
                  borderTopRightRadius: 18
                }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedResources.map(r => (
                <tr key={r.id} style={{ background: "#fff" }}>
                  {editId === r.id ? (
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
                          type="text"
                          value={editDepartment}
                          onChange={e => setEditDepartment(e.target.value)}
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
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
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
                            disabled={loading || !editName.trim() || !editDepartment.trim() || !editRole.trim()}
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
                      }}>{r.name}</td>
                      <td style={{
                        ...tdStyle,
                        color: darkBlue,
                        fontWeight: 600
                      }}>{r.department}</td>
                      <td style={{
                        ...tdStyle,
                        color: darkBlue,
                        fontWeight: 600
                      }}>{r.role}</td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => startEdit(r)}
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
                          onClick={() => deleteResource(r.id)}
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
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {sortedResources.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#888", padding: 24, background: "#fff" }}>
                    No resources found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
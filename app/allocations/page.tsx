'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navigation from '../components/navigation';
import { mainBlue, darkBlue, bgBlue, thStyle as themeThStyle, tdStyle as themeTdStyle, fontFamily } from '../theme';

// Helper to get all days in a given month as YYYY-MM-DD
function getMonthDays(year: number, month: number) {
  const days = new Date(year, month + 1, 0).getDate();
  const result: string[] = [];
  for (let d = 1; d <= days; d++) {
    const day = d.toString().padStart(2, "0");
    result.push(`${year}-${(month + 1).toString().padStart(2, "0")}-${day}`);
  }
  return result;
}

interface Allocation {
  id: string;
  start_date: string;
  end_date: string;
  resources: { name: string };
  projects: { name: string };
}

interface Resource {
  name: string;
}

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Resource filter
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [showResourceDropdown, setShowResourceDropdown] = useState(false);
  const resourceDropdownRef = useRef<HTMLDivElement>(null);

  // Project filter
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Calendar month state
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const days = getMonthDays(year, month);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch allocations
      const { data: allocs, error: allocError } = await supabase
        .from('allocations')
        .select('id, start_date, end_date, resources(name), projects(name)');
      if (allocError) {
        setError(allocError.message);
        return;
      }
      setAllocations(
        Array.isArray(allocs)
          ? allocs.map(a => ({
              ...a,
              resources: Array.isArray(a.resources) ? a.resources[0] : a.resources,
              projects: Array.isArray(a.projects) ? a.projects[0] : a.projects,
            }))
          : []
      );

      // Fetch all resources
      const { data: resData } = await supabase
        .from('resources')
        .select('name');
      setResources(resData || []);
    };
    fetchData();
  }, [month, year]);

  // Close resource dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resourceDropdownRef.current && !resourceDropdownRef.current.contains(event.target as Node)) {
        setShowResourceDropdown(false);
      }
    }
    if (showResourceDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showResourceDropdown]);

  // Close project dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    }
    if (showProjectDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProjectDropdown]);

  // Helper: find allocation for a resource and day
  function getProjectForResourceDay(resourceName: string, day: string) {
    const alloc = allocations.find(a =>
      a.resources?.name === resourceName &&
      a.start_date <= day &&
      a.end_date >= day &&
      (selectedProjects.length === 0 || selectedProjects.includes(a.projects?.name))
    );
    return alloc ? alloc.projects?.name : "";
  }

  // Month navigation handlers
  function prevMonth() {
    setMonth(m => {
      if (m === 0) {
        setYear(y => y - 1);
        return 11;
      }
      return m - 1;
    });
  }
  function nextMonth() {
    setMonth(m => {
      if (m === 11) {
        setYear(y => y + 1);
        return 0;
      }
      return m + 1;
    });
  }

  // Month name for display
  const monthName = new Date(year, month, 1).toLocaleString("en", { month: "long" });

  // Modern calendar styles
  const calendarThStyle: React.CSSProperties = {
    ...themeThStyle,
    background: "#f8fafc",
    color: "#222",
    fontWeight: 700,
    fontSize: 15,
    borderBottom: "2px solid #e5e7eb",
    position: "sticky",
    top: 0,
    zIndex: 2,
    letterSpacing: 0.2,
    padding: "16px 0",
    textAlign: "center",
    transition: "background 0.2s"
  };

  const calendarTdStyle: React.CSSProperties = {
    ...themeTdStyle,
    fontSize: 15,
    color: "#222",
    background: "#fff",
    border: "none",
    padding: 0,
    minWidth: 140,
    maxWidth: 240,
    height: 54,
    textAlign: "center",
    verticalAlign: "middle",
    transition: "background 0.2s, box-shadow 0.2s",
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflow: "visible",
  };

  // Get unique project names from allocations
  const projectNames = Array.from(
    new Set(allocations.map(a => a.projects?.name).filter(Boolean))
  );

  // Filtered resources by selected resource names and selected projects (multiple selection)
  const filteredResources = resources.filter(r => {
    const resourceSelected = selectedResources.length === 0 || selectedResources.includes(r.name);
    const projectSelected =
      selectedProjects.length === 0 ||
      allocations.some(
        a =>
          a.resources?.name === r.name &&
          selectedProjects.includes(a.projects?.name)
      );
    return resourceSelected && projectSelected;
  });

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: `linear-gradient(135deg, #f1f5f9 0%, #e0e7ef 100%)`,
      fontFamily
    }}>
      <Navigation />
      <main style={{
        marginLeft: 240,
        width: "100%",
        minHeight: "100vh",
        margin: 0,
        padding: 40,
        background: "rgba(255,255,255,0.98)",
        borderRadius: 0,
        boxShadow: "none",
        overflowX: "auto"
      }}>
        {/* Month slider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          gap: 16,
          position: "relative"
        }}>
          <button onClick={prevMonth} style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "1.5px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            color: mainBlue,
            fontSize: 18,
            boxShadow: "0 1px 4px 0 rgba(37,99,235,0.04)",
            transition: "background 0.15s"
          }}>
            &lt;
          </button>
          <h2 style={{
            margin: 0,
            color: mainBlue,
            fontWeight: 800,
            fontSize: 32,
            letterSpacing: 1,
            textShadow: "0 2px 8px #e0e7ff"
          }}>
            {monthName} {year}
          </h2>
          <button onClick={nextMonth} style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "1.5px solid #e5e7eb",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
            color: mainBlue,
            fontSize: 18,
            boxShadow: "0 1px 4px 0 rgba(37,99,235,0.04)",
            transition: "background 0.15s"
          }}>
            &gt;
          </button>
        </div>
        {/* Filters row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: 24,
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          gap: 16
        }}>
          {/* Resource filter dropdown */}
          <div style={{ position: "relative", marginLeft: 0 }} ref={resourceDropdownRef}>
            <button
              type="button"
              onClick={() => setShowResourceDropdown(v => !v)}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: `1.5px solid ${mainBlue}`,
                background: "#fff",
                color: mainBlue,
                fontWeight: 700,
                fontFamily,
                fontSize: 15,
                cursor: "pointer",
                minWidth: 180,
                textAlign: "left",
                boxShadow: "0 1px 4px 0 rgba(37,99,235,0.04)"
              }}
            >
              {selectedResources.length === 0
                ? "Filter resources"
                : `${selectedResources.length} selected`}
              <span style={{ float: "right", fontWeight: 400, fontSize: 18, color: "#888" }}>▼</span>
            </button>
            {showResourceDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  zIndex: 10,
                  background: "#fff",
                  border: `1.5px solid ${mainBlue}`,
                  borderRadius: 10,
                  boxShadow: "0 4px 16px 0 rgba(37,99,235,0.10)",
                  padding: 12,
                  minWidth: 220,
                  maxHeight: 260,
                  overflowY: "auto"
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, color: mainBlue, fontSize: 15 }}>
                    <input
                      type="checkbox"
                      checked={selectedResources.length === 0}
                      onChange={() => setSelectedResources([])}
                      style={{ marginRight: 8 }}
                    />
                    All resources
                  </label>
                </div>
                {resources.map(r => (
                  <div key={r.name}>
                    <label style={{ fontWeight: 500, color: "#222", fontSize: 15 }}>
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(r.name)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedResources(prev => [...prev, r.name]);
                          } else {
                            setSelectedResources(prev => prev.filter(n => n !== r.name));
                          }
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {r.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Project filter dropdown */}
          <div style={{ position: "relative" }} ref={projectDropdownRef}>
            <button
              type="button"
              onClick={() => setShowProjectDropdown(v => !v)}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: `1.5px solid ${mainBlue}`,
                background: "#fff",
                color: mainBlue,
                fontWeight: 700,
                fontFamily,
                fontSize: 15,
                cursor: "pointer",
                minWidth: 180,
                textAlign: "left",
                boxShadow: "0 1px 4px 0 rgba(37,99,235,0.04)"
              }}
            >
              {selectedProjects.length === 0
                ? "Filter projects"
                : `${selectedProjects.length} selected`}
              <span style={{ float: "right", fontWeight: 400, fontSize: 18, color: "#888" }}>▼</span>
            </button>
            {showProjectDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "110%",
                  left: 0,
                  zIndex: 10,
                  background: "#fff",
                  border: `1.5px solid ${mainBlue}`,
                  borderRadius: 10,
                  boxShadow: "0 4px 16px 0 rgba(37,99,235,0.10)",
                  padding: 12,
                  minWidth: 220,
                  maxHeight: 260,
                  overflowY: "auto"
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontWeight: 600, color: mainBlue, fontSize: 15 }}>
                    <input
                      type="checkbox"
                      checked={selectedProjects.length === 0}
                      onChange={() => setSelectedProjects([])}
                      style={{ marginRight: 8 }}
                    />
                    All projects
                  </label>
                </div>
                {projectNames.map(name => (
                  <div key={name}>
                    <label style={{ fontWeight: 500, color: "#222", fontSize: 15 }}>
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(name)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedProjects(prev => [...prev, name]);
                          } else {
                            setSelectedProjects(prev => prev.filter(n => n !== name));
                          }
                        }}
                        style={{ marginRight: 8 }}
                      />
                      {name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}
        <div style={{
          overflowX: "auto",
          background: "#f8fafc",
          borderRadius: 18,
          boxShadow: "0 2px 16px 0 rgba(37,99,235,0.08)",
          padding: 24
        }}>
          <table style={{
            borderCollapse: "separate",
            borderSpacing: 0,
            width: "100%",
            minWidth: Math.max(900, days.length * 56),
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 2px 16px 0 rgba(37,99,235,0.06)",
            margin: "0 auto",
            fontFamily,
            overflow: "hidden"
          }}>
            <thead>
              <tr>
                <th style={{
                  ...calendarThStyle,
                  left: 0,
                  zIndex: 3,
                  position: "sticky",
                  borderTopLeftRadius: 18,
                  boxShadow: "2px 0 4px -2px #e5e7eb",
                  background: "#f1f5f9"
                }}>Resource</th>
                {days.map(day => (
                  <th
                    key={day}
                    style={{
                      ...calendarThStyle,
                      minWidth: 56,
                      fontWeight: 500,
                      fontSize: 13,
                      background: "#f8fafc"
                    }}
                  >
                    {new Date(day).getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource, rIdx) => (
                <tr
                  key={resource.name}
                  style={{
                    background: rIdx % 2 === 0 ? "#f9fafb" : "#fff",
                    transition: "background 0.2s"
                  }}
                >
                  <td style={{
                    ...calendarTdStyle,
                    fontWeight: 700,
                    background: "#f3f4f6",
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
                    borderRight: "1px solid #e5e7eb",
                    boxShadow: "2px 0 4px -2px #e5e7eb"
                  }}>
                    <span style={{
                      display: "inline-block",
                      padding: "9px 18px",
                      borderRadius: 8,
                      background: "#fff",
                      color: mainBlue,
                      fontWeight: 700,
                      fontSize: 16,
                      letterSpacing: 0.2,
                      border: "1.5px solid #e0e7eb",
                      boxShadow: "0 1px 2px 0 rgba(0,0,0,0.03)"
                    }}>
                      {resource.name}
                    </span>
                  </td>
                  {days.map(day => {
                    const projectName = getProjectForResourceDay(resource.name, day);
                    return (
                      <td
                        key={day}
                        style={{
                          ...calendarTdStyle,
                          background: "transparent",
                          position: "relative"
                        }}
                      >
                        {projectName && (
                          <span style={{
                            display: "inline-block",
                            background: "linear-gradient(90deg, #e0e7ff 0%, #c7d2fe 100%)",
                            color: "#3730a3",
                            borderRadius: 16,
                            boxShadow: "0 4px 16px 0 rgba(99,102,241,0.10), 0 1.5px 4px 0 rgba(37,99,235,0.06)",
                            padding: "10px 20px",
                            fontWeight: 700,
                            fontSize: 15,
                            border: "1.5px solid #c7d2fe",
                            maxWidth: 220,
                            minWidth: 80,
                            overflow: "visible",
                            textOverflow: "clip",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            transition: "box-shadow 0.2s, background 0.2s",
                            filter: "drop-shadow(0 2px 8px rgba(99,102,241,0.08))"
                          }}>
                            {projectName}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

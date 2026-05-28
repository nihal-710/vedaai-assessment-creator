// src/components/layout/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, BookOpen, Wrench, Library, Settings, Plus } from "lucide-react";

const NAV = [
  { href: "/",            label: "Home",                icon: LayoutGrid, enabled: true },
  { href: "/groups",      label: "My Groups",           icon: Users,      enabled: false },
  { href: "/assignments", label: "Assignments",         icon: BookOpen,   enabled: true },
  { href: "/toolkit",     label: "AI Teacher's Toolkit",icon: Wrench,     enabled: false },
  { href: "/library",     label: "My Library",          icon: Library,    enabled: false },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        {/* V icon — matches Figma orange rounded square with white V */}
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 3L9 15L16 3" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">VedaAI</span>
      </div>

      {/* Create button */}
      <Link href="/create" className="sidebar-create-btn">
        <Plus size={14} strokeWidth={3} />
        Create Assignment
      </Link>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV.map(({ href, label, icon: Icon, enabled }) => {
  const active = enabled && (href === "/" ? path === "/" : path.startsWith(href));

  if (!enabled) {
    return (
      <div
        key={href}
        className="sidebar-nav-item"
        title="Coming soon"
        style={{
          opacity: 0.45,
          cursor: "not-allowed",
          pointerEvents: "none",
        }}
      >
        <Icon size={16} />
        {label}
      </div>
    );
  }

  return (
    <Link
      key={href}
      href={href}
      className={`sidebar-nav-item${active ? " active" : ""}`}
    >
      <Icon size={16} />
      {label}
    </Link>
  );
})}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <div
  className="sidebar-nav-item"
  title="Coming soon"
  style={{
    marginBottom: 8,
    opacity: 0.45,
    cursor: "not-allowed",
    pointerEvents: "none",
  }}
>
  <Settings size={16} />
  Settings
</div>

        {/* School profile — dark circle avatar matching Figma */}
        <div className="sidebar-school-card">
          <div style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#1F2937",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 800,
            flexShrink: 0,
            letterSpacing: "-0.3px",
          }}>
            N
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              Delhi Public School
            </div>
            <div style={{
              fontSize: 11,
              color: "#9CA3AF",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}>
              Bokaro Steel City
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
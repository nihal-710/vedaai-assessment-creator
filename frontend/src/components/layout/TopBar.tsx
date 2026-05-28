// src/components/layout/TopBar.tsx
"use client";
import { Bell, ChevronDown, ArrowLeft, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopBarProps {
  showBack?: boolean;
  backHref?: string;
  breadcrumb?: string;
}

export function TopBar({ showBack, backHref, breadcrumb }: TopBarProps) {
  const router = useRouter();
  return (
    <header className="topbar">
      <div className="topbar-left">
        {showBack && (
          <button className="topbar-back-btn" onClick={() => backHref ? router.push(backHref) : router.back()}>
            <ArrowLeft size={17} />
          </button>
        )}
        {breadcrumb && (
          <div className="topbar-breadcrumb">
            <LayoutGrid size={13} />
            <span>{breadcrumb}</span>
          </div>
        )}
      </div>
      <div className="topbar-right">
        <button className="topbar-bell-btn">
          <Bell size={17} />
          <span className="topbar-bell-dot" />
        </button>
        <button className="topbar-user-btn">
          <div className="topbar-avatar">J</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>John Doe</span>
          <ChevronDown size={13} color="#9CA3AF" />
        </button>
      </div>
    </header>
  );
}
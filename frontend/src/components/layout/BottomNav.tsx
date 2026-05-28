// src/components/layout/BottomNav.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BookOpen, Library, Wrench } from "lucide-react";

const TABS = [
  { href: "/",            label: "Home",       icon: LayoutGrid },
  { href: "/assignments", label: "Assignments", icon: BookOpen },
  { href: "/library",     label: "Library",     icon: Library },
  { href: "/toolkit",     label: "AI Toolkit",  icon: Wrench },
];

export function BottomNav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} className={`bottom-nav-item${active ? " active" : ""}`}>
            <Icon size={19} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
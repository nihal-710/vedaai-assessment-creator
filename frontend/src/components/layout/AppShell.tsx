// src/components/layout/AppShell.tsx
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

type TBProps = React.ComponentProps<typeof TopBar>;

export function AppShell({ children, topBarProps }: { children: React.ReactNode; topBarProps?: TBProps }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopBar {...topBarProps} />
        <div className="page-content">{children}</div>
      </div>
      <BottomNav />
    </div>
  );
}
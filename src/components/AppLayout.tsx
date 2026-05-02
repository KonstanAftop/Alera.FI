import { NavLink, Outlet } from "react-router-dom";
import { Mountain, Map as MapIcon, Table as TableIcon, BookOpen, Radio, Droplets } from "lucide-react";

const navItems = [
  { to: "/", label: "Maps", icon: MapIcon, end: true },
  { to: "/table", label: "Table", icon: TableIcon },
  { to: "/laporkan", label: "Laporkan Banjir", icon: Droplets },
  { to: "/knowledge", label: "Knowledge", icon: BookOpen },
];

const AppLayout = () => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-14 w-full items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-primary-foreground"
            style={{ background: "var(--gradient-accent)" }}
          >
            <Mountain className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">PACU Majalaya</div>
            <div className="text-[10px] text-muted-foreground">Hidromet DAS Citarum</div>
          </div>
        </div>

        <nav className="ml-4 flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
          <Radio className="h-3 w-3 animate-pulse" /> LIVE · MOCKUP
        </span>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Mountain, Map as MapIcon, Table as TableIcon, Droplets, User, LogOut, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const AppLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role;

  const navItems = [
    { to: "/", label: "Peta 3D", icon: MapIcon, end: true, roles: ["personal", "community"] },
    { to: "/table", label: "Data Tabel", icon: TableIcon, roles: ["community"] },
    { to: "/laporkan", label: "Laporan Banjir", icon: Droplets, roles: ["community"] },
    { to: "/telegram", label: "Telegram", icon: MessageCircle, roles: ["community"] },
  ];

  // While loading, only show items available to both roles to prevent flash
  const filteredNav = loading || !userRole
    ? navItems.filter(item => item.roles.includes("personal") && item.roles.includes("community"))
    : navItems.filter(item => item.roles.includes(userRole));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-20 w-full items-center gap-4 border-b border-border/40 bg-background/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex items-center justify-center">
            <img
              src="/alera-logo.png"
              alt="AleraFI Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">AleraFI</div>
            <div className="text-xs text-muted-foreground font-medium">To be safe, alert and aware</div>
          </div>
        </div>

        <nav className="ml-4 flex items-center gap-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">

          <NavLink 
            to="/profile" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                isActive ? "border-primary/50 bg-primary/5" : "border-border hover:border-muted-foreground/30 bg-muted/50"
              }`
            }
          >
            <div className="flex flex-col items-end mr-1 hidden sm:flex">
              <span className="text-[10px] font-bold text-foreground leading-none capitalize">{user?.nama || "User"}</span>
              <span className="text-[9px] text-muted-foreground leading-none capitalize">{userRole === "personal" ? "Individu" : "Komunitas"}</span>
            </div>
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20" style={{ background: "var(--gradient-accent)" }}>
              <User className="h-4 w-4" />
            </div>
          </NavLink>

          <button 
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

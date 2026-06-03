import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Map as MapIcon, Table as TableIcon, Droplets, User, LogOut, MessageCircle, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Skeleton component for loading state
const NavItemSkeleton = () => (
  <div className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 bg-muted/50 animate-pulse">
    <div className="h-4 w-4 bg-muted-foreground/20 rounded" />
    <div className="h-4 w-16 bg-muted-foreground/20 rounded" />
  </div>
);

const AppLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Peta 3D", icon: MapIcon, end: true, roles: ["personal", "community"] },
    { to: "/table", label: "Data Tabel", icon: TableIcon, roles: ["community"] },
    { to: "/laporkan", label: "Laporan Banjir", icon: Droplets, roles: ["community"] },
    { to: "/telegram", label: "Telegram", icon: MessageCircle, roles: ["community"] },
  ];

  // Show skeleton while loading, then filter by role
  const shouldShowSkeleton = loading || !userRole;
  const filteredNav = shouldShowSkeleton
    ? []
    : navItems.filter(item => item.roles.includes(userRole));

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleMobileNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 flex h-20 w-full items-center gap-4 border-b border-border/40 bg-background/80 px-4 sm:px-6 backdrop-blur-xl">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              navigate("/");
            }
          }}
        >
          <div className="h-12 w-12 flex items-center justify-center">
            <img
              src="/alera-logo.png"
              alt="AleraFI Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="text-base font-bold tracking-tight">AleraFI</div>
            <div className="text-xs text-muted-foreground font-medium">To be safe, alert and aware</div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="ml-4 hidden sm:flex items-center gap-1">
          {shouldShowSkeleton ? (
            // Show skeleton placeholders while loading
            <>
              <NavItemSkeleton />
              <NavItemSkeleton />
              <NavItemSkeleton />
              <NavItemSkeleton />
            </>
          ) : (
            // Show actual menu items with fade-in
            filteredNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all animate-in fade-in duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))
          )}
        </nav>

        {/* Mobile Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Profile Button */}
          <NavLink 
            to="/profile" 
            className={({ isActive }) => 
              `flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border transition-all ${
                isActive ? "border-primary/50 bg-primary/5" : "border-border hover:border-muted-foreground/30 bg-muted/50"
              }`
            }
          >
            <div className="flex flex-col items-end mr-1 hidden md:flex">
              <span className="text-[10px] font-bold text-foreground leading-none capitalize">{user?.nama || "User"}</span>
              <span className="text-[9px] text-muted-foreground leading-none capitalize">{userRole === "personal" ? "Individu" : "Komunitas"}</span>
            </div>
            <div className="h-7 w-7 rounded-full flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20" style={{ background: "var(--gradient-accent)" }}>
              <User className="h-4 w-4" />
            </div>
          </NavLink>

          {/* Desktop Logout */}
          <button 
            onClick={handleLogout}
            className="hidden sm:flex p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed top-20 left-0 right-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl shadow-lg animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col p-4 gap-2">
            {shouldShowSkeleton ? (
              // Show skeleton in mobile menu while loading
              <>
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
                <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
              </>
            ) : (
              filteredNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={handleMobileNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all min-h-[44px] ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground hover:bg-muted"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))
            )}
            
            {/* Logout in Mobile Menu */}
            <button
              onClick={() => {
                handleMobileNavClick();
                handleLogout();
              }}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all min-h-[44px]"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </nav>
        </div>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;

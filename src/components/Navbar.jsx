import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trips", label: "My Trips", icon: Map },
  { to: "/community", label: "Community", icon: Compass },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function Navbar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-surface p-4 transition-[width] duration-200 lg:flex ${
          collapsed ? "w-[76px]" : "w-[220px]"
        }`}
      >
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className={`mb-8 flex items-center gap-2 overflow-hidden text-left ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label="Go to dashboard"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-route/10 font-display text-lg font-bold text-route">
            G
          </span>
          {!collapsed && (
            <span className="whitespace-nowrap font-display text-xl font-semibold text-ink">
              GlobeTrotter<span className="text-route">.</span>
            </span>
          )}
        </button>

        <nav className="flex flex-1 flex-col gap-1" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "border border-border bg-bg text-ink shadow-sm"
                    : "text-muted hover:bg-bg hover:text-ink"
                }`
              }
            >
              <Icon size={18} strokeWidth={1.8} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 font-body text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} strokeWidth={1.8} />
          {!collapsed && <span>Log out</span>}
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-sm hover:text-ink"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 font-display text-xl font-semibold text-ink"
          aria-label="Go to dashboard"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-route/10 text-base font-bold text-route">G</span>
          GlobeTrotter<span className="text-route">.</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-ink"
          aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-border bg-surface p-3 shadow-md lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                    isActive ? "bg-bg text-ink" : "text-muted"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted"
            >
              <LogOut size={18} />
              Log out
            </button>
          </nav>
        </div>
      )}
    </>
  );
}

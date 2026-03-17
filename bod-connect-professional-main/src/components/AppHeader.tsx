import { Link, useLocation } from "react-router-dom";
import { Home, User, BarChart3, Briefcase, Users, Bell, Search, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/skills", label: "Skills", icon: BarChart3 },
  { path: "/jobs", label: "Jobs", icon: Briefcase },
  { path: "/network", label: "Network", icon: Users },
];

export default function AppHeader() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container flex h-14 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-lg">B</span>
          </div>
          <span className="font-heading font-bold text-xl text-foreground hidden sm:block">Bod</span>
        </Link>

        <div className={`relative flex-1 max-w-md transition-all ${searchFocused ? "max-w-lg" : ""}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills, jobs, people..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center px-3 py-1 rounded-md text-xs transition-colors relative ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="mt-0.5">{item.label}</span>
                {active && (
                  <motion.div layoutId="nav-indicator" className="absolute -bottom-[9px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <button className="relative p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors hidden md:flex">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
        </button>

        <button
          onClick={signOut}
          className="hidden md:flex p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>

        <button className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border overflow-hidden bg-card"
          >
            <div className="container py-2 flex flex-col gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => { setMobileOpen(false); signOut(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

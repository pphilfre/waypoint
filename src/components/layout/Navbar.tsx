import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  Route as RouteIcon,
  Briefcase,
  FileText,
  CalendarClock,
  Users,
  Menu,
  X,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: <LayoutDashboard size={15} /> },
  { label: "Companies", to: "/companies", icon: <Building2 size={15} /> },
  { label: "Opportunities", to: "/opportunities", icon: <Briefcase size={15} /> },
  { label: "Applications", to: "/applications", icon: <FileText size={15} /> },
  { label: "Deadlines", to: "/deadlines", icon: <CalendarClock size={15} /> },
  { label: "Contacts", to: "/contacts", icon: <Users size={15} /> },
];

interface NavbarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "WP";
}

function PillNavItem({ item }: { item: NavItem }) {
  const state = useRouterState();
  const pathname = state.location.pathname;

  // Exact match for home, prefix match for others
  const isActive =
    item.to === "/"
      ? pathname === "/"
      : pathname === item.to || pathname.startsWith(item.to + "/");

  return (
    <Link
      to={item.to}
      className={cn(
        "nav-pill-item flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)] text-sm font-medium transition-colors select-none",
        isActive
          ? "bg-[hsl(var(--nav-item-active-bg))] text-[hsl(var(--nav-item-active-text))]"
          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--nav-item-hover))] hover:text-[hsl(var(--foreground))]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

export function Navbar({ user, onSignIn, onSignOut }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop / tablet navbar */}
      <header
        className="app-nav sticky top-0 z-40 w-full"
      >
        <div className="app-nav-inner mx-auto flex h-12 max-w-[1400px] items-center gap-3 px-3">
          {/* Logo */}
          <Link
            to="/"
            className="brand-lockup mr-3 flex items-center gap-2 shrink-0"
            aria-label="Waypoint home"
          >
            <div
              className="brand-mark h-7 w-7 rounded-[var(--radius-sm)] flex items-center justify-center text-[hsl(var(--primary-foreground))]"
            >
              <RouteIcon size={14} strokeWidth={2.4} />
            </div>
            <span className="font-semibold text-sm text-[hsl(var(--foreground))] hidden sm:block">
              Waypoint
            </span>
          </Link>

          {/* Pill nav – desktop */}
          <nav
            className="nav-pill-rail hidden md:flex items-center gap-0.5 flex-1"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map((item) => (
              <PillNavItem key={item.to} item={item} />
            ))}
          </nav>

          <div className="flex-1 md:hidden" />

          {/* Right side */}
          <div className="flex items-center gap-2">
            {!user && (
              <button
                onClick={onSignIn}
                className="hidden sm:inline-flex items-center rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] transition-colors"
              >
                Sign in
              </button>
            )}
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2 py-1 text-sm transition-colors",
                    "hover:bg-[hsl(var(--nav-item-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  )}
                  aria-label="User menu"
                >
                  <Avatar className="h-6 w-6">
                    {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name ?? ""} />}
                    <AvatarFallback className="text-[10px]">
                      {getInitials(user?.name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-[hsl(var(--foreground))] text-xs font-medium max-w-[100px] truncate">
                    {user?.name ?? user?.email ?? "Account"}
                  </span>
                  <ChevronDown size={12} className="text-[hsl(var(--muted-foreground))]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {user && (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                        {user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 w-full">
                    <Settings size={14} />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onSignOut}
                  className="text-[hsl(var(--destructive))] focus:text-[hsl(var(--destructive))]"
                >
                  <LogOut size={14} />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-[var(--radius-sm)] hover:bg-[hsl(var(--nav-item-hover))] transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute top-0 left-0 h-full w-72 bg-[hsl(var(--surface-overlay))] border-r border-[hsl(var(--border))] flex flex-col shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between px-4 h-12 border-b border-[hsl(var(--border))]">
              <span className="font-semibold text-sm">Waypoint</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[hsl(var(--nav-item-hover))]"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <MobileNavItem
                  key={item.to}
                  item={item}
                  onClose={() => setMobileOpen(false)}
                />
              ))}
              <MobileNavItem
                item={{ label: "Settings", to: "/settings", icon: <Settings size={15} /> }}
                onClose={() => setMobileOpen(false)}
              />
            </nav>
            <div className="p-3 border-t border-[hsl(var(--border))]">
              {user ? (
                <button
                  onClick={() => {
                    onSignOut?.();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm text-[hsl(var(--destructive))] hover:bg-[hsl(var(--nav-item-hover))] transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              ) : (
                <button
                  onClick={() => {
                    onSignIn?.();
                    setMobileOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileNavItem({
  item,
  onClose,
}: {
  item: NavItem;
  onClose: () => void;
}) {
  const state = useRouterState();
  const pathname = state.location.pathname;
  const isActive =
    item.to === "/"
      ? pathname === "/"
      : pathname === item.to || pathname.startsWith(item.to + "/");

  return (
    <Link
      to={item.to}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors",
        isActive
          ? "bg-[hsl(var(--nav-item-active-bg))] text-[hsl(var(--nav-item-active-text))]"
          : "text-[hsl(var(--foreground))] hover:bg-[hsl(var(--nav-item-hover))]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

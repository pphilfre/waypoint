import { Link, useRouterState } from "@tanstack/react-router";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  ChevronsUpDown,
  Compass,
  FileText,
  House,
  LogOut,
  Menu,
  Search,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickCreate } from "./QuickCreate";
import { WorkspaceSearch } from "./WorkspaceSearch";

export const navigation = [
  { label: "Overview", to: "/", icon: House, group: "Workspace" },
  {
    label: "Applications",
    to: "/applications",
    icon: FileText,
    group: "Workspace",
  },
  {
    label: "Deadlines",
    to: "/deadlines",
    icon: CalendarDays,
    group: "Workspace",
  },
  { label: "Companies", to: "/companies", icon: Building2, group: "Research" },
  {
    label: "Opportunities",
    to: "/opportunities",
    icon: BriefcaseBusiness,
    group: "Research",
  },
  { label: "Contacts", to: "/contacts", icon: Users, group: "Research" },
  { label: "Rankings", to: "/rankings", icon: Trophy, group: "Research" },
];
interface NavbarProps {
  user?: { name?: string; email?: string; avatarUrl?: string } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
}
export function Navbar({ user, onSignOut }: NavbarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const current = navigation.find((item) => item.to === pathname);
  const sidebar = (
    <>
      <Link
        to="/"
        className="workspace-brand"
        onClick={() => setMobileOpen(false)}
      >
        <span>
          <Compass size={21} strokeWidth={1.7} />
        </span>
        Waypoint
      </Link>
      <button
        className="workspace-search-trigger"
        onClick={() => {
          setMobileOpen(false);
          setSearchOpen(true);
        }}
      >
        <Search size={16} />
        <span>Search anything</span>
        <kbd>Ctrl K</kbd>
      </button>
      <nav className="workspace-navigation" aria-label="Primary navigation">
        {["Workspace", "Research"].map((group) => (
          <div key={group}>
            <p>{group}</p>
            {navigation
              .filter((item) => item.group === group)
              .map(({ icon: Icon, ...item }) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={pathname === item.to ? "is-current" : ""}
                  aria-current={pathname === item.to ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={17} strokeWidth={1.7} />
                  <span>{item.label}</span>
                </Link>
              ))}
          </div>
        ))}
      </nav>
      <div className="workspace-sidebar-bottom">
        <Link
          to="/settings"
          className={pathname === "/settings" ? "is-current" : ""}
          onClick={() => setMobileOpen(false)}
        >
          <Settings size={17} />
          <span>Settings</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="workspace-account" aria-label="Account menu">
              <span className="account-initial">
                {user?.name?.slice(0, 1) ?? "W"}
              </span>
              <span>
                <strong>{user?.name ?? "Your workspace"}</strong>
                <small>Personal workspace</small>
              </span>
              <ChevronsUpDown size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <p className="account-email">{user?.email}</p>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut size={14} /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="workspace-sidebar">{sidebar}</aside>
      <header className="workspace-topbar">
        <div>
          <button
            className="mobile-menu-trigger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={19} />
          </button>
          <span className="topbar-context">
            {current?.group ?? "Workspace"}
          </span>
          <span className="topbar-slash">/</span>
          <strong>{current?.label ?? "Settings"}</strong>
        </div>
        <div>
          <button
            className="topbar-search"
            aria-label="Search workspace"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={17} />
          </button>
          <QuickCreate />
        </div>
      </header>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="mobile-sidebar">
            <Dialog.Title className="sr-only">Navigation</Dialog.Title>
            <Dialog.Description className="sr-only">
              Explore your workspace
            </Dialog.Description>
            <Dialog.Close
              className="mobile-sidebar-close"
              aria-label="Close navigation"
            >
              <X size={18} />
            </Dialog.Close>
            {sidebar}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <WorkspaceSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

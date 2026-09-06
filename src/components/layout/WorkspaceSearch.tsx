import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { useQuery } from "convex/react";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Building2,
  BriefcaseBusiness,
  FileText,
  Search,
  Users,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { navigation } from "./Navbar";

export function WorkspaceSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="command-dialog">
          <Dialog.Title className="sr-only">Search workspace</Dialog.Title>
          <Dialog.Description className="sr-only">
            Find records or jump to a page. Use arrow keys to select and Enter
            to open.
          </Dialog.Description>
          <SearchContent onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function SearchContent({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const args = user ? { workosUserId: user.id } : ("skip" as const);
  const companies = useQuery(api.companies.list, args);
  const opportunities = useQuery(api.opportunities.list, args);
  const applications = useQuery(api.applications.list, args);
  const contacts = useQuery(api.contacts.list, args);
  const navigate = useNavigate();
  const go = (to: string, record?: string) => {
    onClose();
    void navigate({
      to,
      search: record ? ({ record } as never) : ({} as never),
    });
  };
  const groups = [
    {
      label: "Companies",
      to: "/companies",
      icon: Building2,
      items: (companies ?? []).map((item) => ({
        id: item._id,
        title: item.name,
        detail: item.websiteUrl,
      })),
    },
    {
      label: "Opportunities",
      to: "/opportunities",
      icon: BriefcaseBusiness,
      items: (opportunities ?? []).map((item) => ({
        id: item._id,
        title: item.name,
        detail: item.company?.name,
      })),
    },
    {
      label: "Applications",
      to: "/applications",
      icon: FileText,
      items: (applications ?? []).map((item) => ({
        id: item._id,
        title: item.company?.name ?? "Application",
        detail: `${item.opportunity?.name ?? "General application"} ${item.status}`,
      })),
    },
    {
      label: "Contacts",
      to: "/contacts",
      icon: Users,
      items: (contacts ?? []).map((item) => ({
        id: item._id,
        title: item.name,
        detail: item.company?.name,
      })),
    },
  ];
  return (
    <Command label="Search workspace">
      <div className="command-input">
        <Search size={20} />
        <Command.Input
          autoFocus
          placeholder="Search companies, roles, people…"
        />
        <Dialog.Close aria-label="Close search">
          <kbd>Esc</kbd>
        </Dialog.Close>
      </div>
      <Command.List>
        <Command.Empty>No results. Try another name or company.</Command.Empty>
        <Command.Group heading="Go to">
          {navigation.map(({ icon: Icon, ...item }) => (
            <Command.Item
              key={item.to}
              value={`Go to ${item.label}`}
              onSelect={() => go(item.to)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
              <small>Open page</small>
            </Command.Item>
          ))}
        </Command.Group>
        {groups.map(({ icon: Icon, ...group }) => (
          <Command.Group key={group.to} heading={group.label}>
            {group.items.map((item) => (
              <Command.Item
                key={item.id}
                value={`${group.label} ${item.title} ${item.detail} ${item.id}`}
                onSelect={() => go(group.to, item.id)}
              >
                <Icon size={16} />
                <span>
                  {item.title}
                  <small>{item.detail}</small>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        ))}
        {companies === undefined && (
          <p className="command-loading">Loading your records…</p>
        )}
      </Command.List>
      <footer>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> Navigate
        </span>
        <span>
          <kbd>↵</kbd> Open
        </span>
      </footer>
    </Command>
  );
}

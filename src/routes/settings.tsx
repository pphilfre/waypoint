import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@workos-inc/authkit-react";
import { useMutation, useQuery } from "convex/react";
import { useTheme, type ThemeMode, type ColorScheme } from "@/context/theme-context";
import { cn } from "@/lib/utils";
import { Check, Plus, Shapes, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "../../convex/_generated/api";
import { RatingConfiguration } from "@/components/ratings/RatingConfiguration";
import { DataExchange } from "@/components/settings/DataExchange";
import { TrashView } from "@/components/settings/TrashView";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const THEMES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const COLOR_SCHEMES: {
  value: ColorScheme;
  label: string;
  primary: string;
}[] = [
  {
    value: "green",
    label: "Pale Green",
    primary: "#A3B18A",
  },
  {
    value: "indigo",
    label: "Indigo",
    primary: "#6366f1",
  },
  {
    value: "mono",
    label: "Monochrome",
    primary: "#475569",
  },
  {
    value: "warm",
    label: "Warm",
    primary: "#f97316",
  },
  {
    value: "blue",
    label: "Blue",
    primary: "#3b82f6",
  },
];

function SettingsPage() {
  const { mode, colorScheme, setMode, setColorScheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-2xl space-y-10">
      <PageHeader
        title="Settings"
        description="Customise your Waypoint experience."
      />

      {/* Appearance */}
      <section>
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">Appearance</h2>

        {/* Theme mode */}
        <div className="mb-6">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
            Theme
          </p>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => setMode(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-[var(--radius)] border transition-all text-sm",
                  mode === t.value
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary-subtle))] text-[hsl(var(--nav-item-active-text))]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--primary-subtle-border))]"
                )}
              >
                <ThemePreviewSwatch mode={t.value} />
                <span className="font-medium">{t.label}</span>
                {mode === t.value && <Check size={12} className="text-[hsl(var(--primary))]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Colour scheme */}
        <div>
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
            Colour scheme
          </p>
          <div className="flex flex-wrap gap-3">
            {COLOR_SCHEMES.map((s) => (
              <button
                key={s.value}
                onClick={() => setColorScheme(s.value)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius)] border transition-all text-sm",
                  colorScheme === s.value
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary-subtle))]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--primary-subtle-border))]"
                )}
                aria-pressed={colorScheme === s.value}
              >
                <span
                  className="h-4 w-4 rounded-full ring-2 ring-offset-1 ring-[hsl(var(--background))] shrink-0"
                  style={{ backgroundColor: s.primary }}
                />
                <span
                  className={cn(
                    "font-medium",
                    colorScheme === s.value
                      ? "text-[hsl(var(--nav-item-active-text))]"
                      : "text-[hsl(var(--foreground))]"
                  )}
                >
                  {s.label}
                </span>
                {colorScheme === s.value && (
                  <Check size={12} className="text-[hsl(var(--primary))]" />
                )}
              </button>
            ))}
          </div>

          {/* Preview strip */}
          <div className="mt-5 rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-3">Preview</p>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Primary button */}
              <span className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                Primary
              </span>
              {/* Active nav pill */}
              <span className="px-3 py-1.5 rounded-[var(--radius-pill)] text-xs font-medium bg-[hsl(var(--nav-item-active-bg))] text-[hsl(var(--nav-item-active-text))]">
                Active nav
              </span>
              {/* Status pill */}
              <span className="px-2.5 py-1 rounded-[var(--radius-pill)] text-xs font-medium bg-[hsl(var(--primary-subtle))] text-[hsl(var(--nav-item-active-text))] border border-[hsl(var(--primary-subtle-border))]">
                Applied
              </span>
              {/* Input ring demo */}
              <span className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs border border-[hsl(var(--primary))] bg-[hsl(var(--surface-overlay))] text-[hsl(var(--foreground))]">
                Focused input
              </span>
              {/* Score */}
              <span className="text-xs font-semibold text-[hsl(var(--primary))]">
                94 / 100
              </span>
            </div>
          </div>
        </div>
      </section>

      <WorkflowConfiguration workosUserId={user?.id} />
      <RatingConfiguration workosUserId={user?.id} />
      <DataExchange />
      <TrashView workosUserId={user?.id} />

      <section>
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
          Account
        </h2>
        <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                "Signed in"}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
              {user?.email}
            </p>
          </div>
          <Button variant="secondary" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </section>

    </div>
  );
}

function WorkflowConfiguration({ workosUserId }: { workosUserId?: string }) {
  const types = useQuery(api.opportunities.listTypes, workosUserId ? { workosUserId } : "skip");
  const statuses = useQuery(api.applications.listStatuses, workosUserId ? { workosUserId } : "skip");
  const createType = useMutation(api.opportunities.createType);
  const createStatus = useMutation(api.applications.createStatus);
  const [typeName, setTypeName] = useState("");
  const [statusName, setStatusName] = useState("");
  if (!workosUserId) return null;
  return <section className="settings-workflows"><div className="settings-section-heading"><div><h2>Workflow</h2><p>Extend the built-in types and stages to match your search.</p></div></div><div className="workflow-settings-grid"><div className="config-card"><header><span><Shapes size={14}/></span><div><strong>Opportunity types</strong><small>Custom types appear beside the built-in five.</small></div></header><div className="config-tags">{types?.map(type => <span key={type._id}><i style={{background:type.color}}/>{type.name}</span>)}{types?.length === 0 && <em>No custom types</em>}</div><form onSubmit={event => { event.preventDefault(); const name=typeName.trim(); if (!name) return; void createType({ workosUserId, name, icon:"BriefcaseBusiness", color:"#A3B18A" }).then(()=>setTypeName("")); }}><input value={typeName} onChange={event=>setTypeName(event.target.value)} placeholder="e.g. Spring week"/><button aria-label="Add opportunity type"><Plus size={14}/></button></form></div><div className="config-card"><header><span><Workflow size={14}/></span><div><strong>Application statuses</strong><small>Add a stage to the application board.</small></div></header><div className="config-tags">{statuses?.map(status => <span key={status._id}><i style={{background:status.color}}/>{status.name}</span>)}{statuses?.length === 0 && <em>No custom statuses</em>}</div><form onSubmit={event => { event.preventDefault(); const name=statusName.trim(); if (!name) return; void createStatus({ workosUserId, name, color:"#A3B18A" }).then(()=>setStatusName("")); }}><input value={statusName} onChange={event=>setStatusName(event.target.value)} placeholder="e.g. Phone screen"/><button aria-label="Add application status"><Plus size={14}/></button></form></div></div></section>;
}

function ThemePreviewSwatch({ mode }: { mode: ThemeMode }) {
  if (mode === "light") {
    return (
      <div className="w-16 h-10 rounded-[4px] border border-gray-200 bg-white flex flex-col overflow-hidden">
        <div className="h-3 bg-gray-100 border-b border-gray-200 flex items-center px-1 gap-0.5">
          <div className="w-2 h-1 rounded-full bg-gray-300" />
          <div className="w-4 h-1 rounded-full bg-gray-300" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-1 p-1">
          <div className="w-3 h-3 rounded-full bg-[#A3B18A] opacity-80" />
          <div className="flex-1 space-y-0.5">
            <div className="h-1 bg-gray-200 rounded-full" />
            <div className="h-1 bg-gray-200 rounded-full w-3/4" />
          </div>
        </div>
      </div>
    );
  }
  if (mode === "dark") {
    return (
      <div className="w-16 h-10 rounded-[4px] border border-gray-700 bg-[#0f1629] flex flex-col overflow-hidden">
        <div className="h-3 bg-[#1a2540] border-b border-gray-700 flex items-center px-1 gap-0.5">
          <div className="w-2 h-1 rounded-full bg-gray-600" />
          <div className="w-4 h-1 rounded-full bg-gray-600" />
        </div>
        <div className="flex-1 flex items-center justify-center gap-1 p-1">
          <div className="w-3 h-3 rounded-full bg-[#A3B18A] opacity-80" />
          <div className="flex-1 space-y-0.5">
            <div className="h-1 bg-gray-600 rounded-full" />
            <div className="h-1 bg-gray-600 rounded-full w-3/4" />
          </div>
        </div>
      </div>
    );
  }
  // System
  return (
    <div className="w-16 h-10 rounded-[4px] border border-gray-300 flex flex-col overflow-hidden">
      <div className="flex flex-1">
        <div className="w-1/2 bg-white" />
        <div className="w-1/2 bg-[#0f1629]" />
      </div>
      <div className="h-3 bg-gradient-to-r from-gray-100 to-[#1a2540] flex items-center px-1 gap-0.5">
        <div className="w-4 h-1 rounded-full bg-gray-400 opacity-60" />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title?: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6">
      {title && (
        <h2 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
          {title}
        </h2>
      )}
      <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
        {icon}
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-[240px]">
          {message}
        </p>
        {action}
      </div>
    </div>
  );
}

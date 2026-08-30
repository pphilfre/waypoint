import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

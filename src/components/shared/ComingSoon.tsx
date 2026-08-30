export function ComingSoon({
  phase,
  feature,
}: {
  phase: number;
  feature: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-12 flex flex-col items-center text-center gap-3">
      <span className="text-xs font-medium px-2.5 py-1 rounded-[var(--radius-pill)] bg-[hsl(var(--primary-subtle))] text-[hsl(var(--nav-item-active-text))]">
        Phase {phase}
      </span>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs">{feature}</p>
    </div>
  );
}

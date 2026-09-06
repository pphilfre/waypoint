interface Application {
  _id: string;
  archived?: boolean;
  status: string;
  nextAction?: string;
  nextActionDue?: number;
  deadlines: { name: string; date: number }[];
  company?: { name: string } | null;
  opportunity?: { name: string } | null;
}
interface Opportunity {
  _id: string;
  archived?: boolean;
  name: string;
  checkAgainAt?: number;
  deadlines: { name: string; date: number }[];
  company?: { name: string } | null;
}
export interface FocusItem {
  id: string;
  recordId: string;
  kind: "Application" | "Research";
  to: "/applications" | "/opportunities";
  title: string;
  company: string;
  subtitle: string;
  date?: number;
  overdue: boolean;
}
export function buildFocusQueue(
  applications: Application[],
  opportunities: Opportunity[],
  now = Date.now(),
): FocusItem[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 7);
  const items: FocusItem[] = applications
    .filter(
      (item) =>
        !item.archived &&
        !["Offer", "Rejected", "Withdrawn"].includes(item.status) &&
        (!item.nextAction ||
          (!!item.nextActionDue && item.nextActionDue < soon.getTime())),
    )
    .map((item) => ({
      id: `a-${item._id}`,
      recordId: item._id,
      kind: "Application",
      to: "/applications",
      title: item.nextAction || "Decide your next action",
      company: item.company?.name ?? "Company",
      subtitle: item.opportunity?.name ?? item.status,
      date: item.nextActionDue,
      overdue: !!item.nextActionDue && item.nextActionDue < today.getTime(),
    }));
  for (const item of opportunities)
    if (
      !item.archived &&
      item.checkAgainAt &&
      item.checkAgainAt < soon.getTime()
    )
      items.push({
        id: `o-${item._id}`,
        recordId: item._id,
        kind: "Research",
        to: "/opportunities",
        title: `Review ${item.name}`,
        company: item.company?.name ?? "Company",
        subtitle: "Research reminder",
        date: item.checkAgainAt,
        overdue: item.checkAgainAt < today.getTime(),
      });
  return items.sort((a, b) => (a.date ?? Infinity) - (b.date ?? Infinity));
}
export function collectDeadlines(
  applications: Application[],
  opportunities: Opportunity[],
  now = Date.now(),
) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return [
    ...applications
      .filter(
        (item) =>
          !item.archived && !["Rejected", "Withdrawn"].includes(item.status),
      )
      .flatMap((item) =>
        item.deadlines.map((deadline, index) => ({
          ...deadline,
          id: `a-${item._id}-${index}`,
          recordId: item._id,
          to: "/applications" as const,
          company: item.company?.name ?? "Company",
        })),
      ),
    ...opportunities
      .filter((item) => !item.archived)
      .flatMap((item) =>
        item.deadlines.map((deadline, index) => ({
          ...deadline,
          id: `o-${item._id}-${index}`,
          recordId: item._id,
          to: "/opportunities" as const,
          company: item.company?.name ?? "Company",
        })),
      ),
  ]
    .filter((item) => item.date >= today.getTime())
    .sort((a, b) => a.date - b.date);
}
export function relativeDue(timestamp: number, now = Date.now()) {
  const day = (value: number) => {
    const d = new Date(value);
    return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  };
  const days = Math.round((day(timestamp) - day(now)) / 86400000);
  return days < 0
    ? `${Math.abs(days)}d overdue`
    : days === 0
      ? "Today"
      : days === 1
        ? "Tomorrow"
        : days < 7
          ? `In ${days} days`
          : new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
            }).format(timestamp);
}

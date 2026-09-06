import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { useQuery } from "convex/react";
import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  List,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { downloadFile, toIcs } from "@/lib/export";

export const Route = createFileRoute("/deadlines")({ component: DeadlinesPage });

type Scope = "upcoming" | "past" | "all";
type ViewMode = "calendar" | "list";
type DeadlineRow = {
  id: string;
  recordId: string;
  name: string;
  date: number;
  source: "Opportunity" | "Application";
  company: string;
  companyLogoUrl?: string | null;
  opportunity: string;
  status: string;
};

function DeadlinesPage() {
  const { user } = useAuth();
  const uid = user?.id;
  const opportunities = useQuery(api.opportunities.list, uid ? { workosUserId: uid } : "skip");
  const applications = useQuery(api.applications.list, uid ? { workosUserId: uid } : "skip");
  const companies = useQuery(api.companies.list, uid ? { workosUserId: uid } : "skip");
  const [scope, setScope] = useState<Scope>("upcoming");
  const [view, setView] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const initialDateSet = useRef(false);

  const companyLookup = useMemo(
    () => new Map((companies ?? []).map((company: any) => [String(company._id), company])),
    [companies],
  );
  const deadlines = useMemo<DeadlineRow[]>(() => [
    ...(opportunities ?? []).filter(item=>!item.archived).flatMap((item: any) => {
      const company = companyLookup.get(String(item.companyId)) ?? item.company;
      return item.deadlines.map((deadline: any, index: number) => ({
        id: `o-${item._id}-${index}`,
        recordId: item._id,
        name: deadline.name,
        date: deadline.date,
        source: "Opportunity" as const,
        company: company?.name ?? "Unknown company",
        companyLogoUrl: company?.logoUrl,
        opportunity: item.name,
        status: item.status,
      }));
    }),
    ...(applications ?? []).filter(item=>!item.archived).flatMap((item: any) => {
      const company = companyLookup.get(String(item.companyId)) ?? item.company;
      return item.deadlines.map((deadline: any, index: number) => ({
        id: `a-${item._id}-${index}`,
        recordId: item._id,
        name: deadline.name,
        date: deadline.date,
        source: "Application" as const,
        company: company?.name ?? "Unknown company",
        companyLogoUrl: company?.logoUrl,
        opportunity: item.opportunity?.name ?? "General application",
        status: item.status,
      }));
    }),
  ].sort((a, b) => a.date - b.date), [applications, companyLookup, opportunities]);

  const now = startOfToday();
  const visible = useMemo(
    () => deadlines.filter((item) => matchesScope(item, scope, now)),
    [deadlines, now, scope],
  );
  const next = deadlines.find((item) => item.date >= now);

  useEffect(() => {
    if (initialDateSet.current || !next) return;
    const date = new Date(next.date);
    initialDateSet.current = true;
    setSelectedDate(date);
    setCalendarMonth(date);
  }, [next]);

  const selectScope = (nextScope: Scope) => {
    setScope(nextScope);
    const candidate = deadlines.find((item) => matchesScope(item, nextScope, now));
    if (candidate) {
      const date = new Date(candidate.date);
      setSelectedDate(date);
      setCalendarMonth(date);
    }
  };

  return (
    <div className="deadline-workspace">
      <header className="page-command deadline-heading">
        <div>
          <p className="page-kicker">Timeline</p>
          <h1>Deadlines</h1>
          <span>See every milestone in context, then move straight to the relevant record.</span>
        </div>
        <div className="deadline-heading-actions"><button className="calendar-export" disabled={!deadlines.length} onClick={()=>downloadFile("waypoint-deadlines.ics",toIcs(deadlines.map(item=>({title:`${item.company} · ${item.name}`,date:item.date,description:`${item.opportunity} · ${item.source} · ${item.status}`}))),"text/calendar")}><Download size={13}/> Export calendar</button>{next && (
          <div className="next-deadline-card">
            <CompanyLogo name={next.company} logoUrl={next.companyLogoUrl} />
            <div>
              <span>Next deadline · {countdown(next.date)}</span>
              <strong>{next.name}</strong>
              <small>{next.company} · {formatFullDate(next.date)}</small>
            </div>
          </div>
        )}</div>
      </header>

      <section className="deadline-summary" aria-label="Deadline totals">
        <div><CalendarClock size={17} /><span>Upcoming<strong>{deadlines.filter((item) => item.date >= now).length}</strong></span></div>
        <div><Clock3 size={17} /><span>Within 7 days<strong>{deadlines.filter((item) => { const days = daysBetween(item.date); return days >= 0 && days <= 7; }).length}</strong></span></div>
        <div><CalendarDays size={17} /><span>Passed<strong>{deadlines.filter((item) => item.date < now).length}</strong></span></div>
      </section>

      <section className="deadline-board">
        <header className="deadline-toolbar">
          <div className="view-switch" aria-label="Deadline view">
            <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")} aria-pressed={view === "calendar"}><CalendarDays size={15} /><span>Calendar</span></button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-pressed={view === "list"}><List size={15} /><span>List</span></button>
          </div>
          <div className="deadline-toolbar-right">
            <div className="segmented-control">
              {(["upcoming", "past", "all"] as const).map((value) => (
                <button className={scope === value ? "active" : ""} onClick={() => selectScope(value)} key={value}>{capitalize(value)}</button>
              ))}
            </div>
            <span>{visible.length} milestone{visible.length === 1 ? "" : "s"}</span>
          </div>
        </header>

        {opportunities === undefined || applications === undefined || companies === undefined ? (
          <DeadlineSkeleton />
        ) : view === "calendar" ? (
          <DeadlineCalendar
            deadlines={visible}
            month={calendarMonth}
            selectedDate={selectedDate}
            onMonthChange={setCalendarMonth}
            onSelectDate={setSelectedDate}
          />
        ) : (
          <DeadlineList deadlines={visible} scope={scope} />
        )}
      </section>
    </div>
  );
}

function DeadlineCalendar({
  deadlines,
  month,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: {
  deadlines: DeadlineRow[];
  month: Date;
  selectedDate?: Date;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const [selectionMode, setSelectionMode] = useState<"day" | "month">("day");
  const deadlineDates = deadlines.map((item) => new Date(item.date));
  const selectedDeadlines = selectionMode === "month"
    ? deadlines.filter((item) => isSameMonth(new Date(item.date), month))
    : selectedDate
      ? deadlines.filter((item) => isSameDay(new Date(item.date), selectedDate))
      : [];
  const selectedPeriodLabel = selectionMode === "month"
    ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(month)
    : selectedDate
      ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(selectedDate)
      : "Deadline agenda";

  return (
    <div className="deadline-calendar-layout">
      <div className="deadline-calendar-surface">
        <div className="calendar-selection-toolbar">
          <div>
            <strong>Select a period</strong>
            <span>{selectionMode === "day" ? "Choose an individual deadline date" : "Choose a whole month to review"}</span>
          </div>
          <div className="calendar-granularity" aria-label="Calendar selection type">
            <button className={selectionMode === "day" ? "active" : ""} onClick={() => setSelectionMode("day")} aria-pressed={selectionMode === "day"}>Day</button>
            <button className={selectionMode === "month" ? "active" : ""} onClick={() => setSelectionMode("month")} aria-pressed={selectionMode === "month"}>Month</button>
          </div>
        </div>

        {selectionMode === "day" ? (
          <Calendar
            mode="single"
            month={month}
            onMonthChange={onMonthChange}
            selected={selectedDate}
            onDayClick={onSelectDate}
            fixedWeeks
            showOutsideDays
            modifiers={{
              hasDeadline: deadlineDates,
              urgentDeadline: deadlines.filter((item) => urgencyFor(item.date) === "urgent").map((item) => new Date(item.date)),
            }}
            modifiersClassNames={{
              hasDeadline: "has-deadline",
              urgentDeadline: "has-urgent-deadline",
            }}
            components={{
              DayButton: (props) => {
                const items = deadlines.filter((item) => isSameDay(new Date(item.date), props.day.date));
                const companyNames = [...new Set(items.map((item) => item.company))];
                return (
                  <CalendarDayButton {...props} className={cn(items.length && "contains-deadline")}>
                    <span className="calendar-day-number">{props.day.date.getDate()}</span>
                    {items.length > 0 && (
                      <span className="calendar-company-stack" aria-label={`Deadlines for ${companyNames.join(", ")}`}>
                        {items.slice(0, 3).map((item) => <CompanyLogo key={item.id} name={item.company} logoUrl={item.companyLogoUrl} mini />)}
                        {items.length > 3 && <i>+{items.length - 3}</i>}
                      </span>
                    )}
                  </CalendarDayButton>
                );
              },
            }}
          />
        ) : (
          <MonthOverview deadlines={deadlines} month={month} onSelectMonth={onMonthChange} />
        )}
      </div>

      <aside className="calendar-agenda">
        <header>
          <span>{selectionMode === "month" ? "Selected month" : selectedDate ? new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(selectedDate) : "Select a date"}</span>
          <strong>{selectedPeriodLabel}</strong>
          <small>{selectedDeadlines.length} milestone{selectedDeadlines.length === 1 ? "" : "s"}</small>
        </header>
        {selectedDeadlines.length ? (
          <div className="calendar-agenda-list">
            {selectedDeadlines.map((item) => <AgendaItem item={item} key={item.id} />)}
          </div>
        ) : (
          <div className="calendar-agenda-empty"><CalendarClock size={21} /><strong>Nothing due</strong><span>Choose a {selectionMode} with company milestones to see them here.</span></div>
        )}
      </aside>
    </div>
  );
}

function MonthOverview({ deadlines, month, onSelectMonth }: { deadlines: DeadlineRow[]; month: Date; onSelectMonth: (month: Date) => void }) {
  const year = month.getFullYear();
  const months = Array.from({ length: 12 }, (_, index) => new Date(year, index, 1));
  const changeYear = (offset: number) => onSelectMonth(new Date(year + offset, month.getMonth(), 1));

  return (
    <div className="month-overview">
      <header>
        <strong>{year}</strong>
        <div>
          <button onClick={() => changeYear(-1)} aria-label={`Show ${year - 1}`}><ChevronLeft size={14} /></button>
          <button onClick={() => changeYear(1)} aria-label={`Show ${year + 1}`}><ChevronRight size={14} /></button>
        </div>
      </header>
      <div className="month-overview-grid">
        {months.map((calendarMonth) => {
          const items = deadlines.filter((item) => isSameMonth(new Date(item.date), calendarMonth));
          const companies = [...new Map(items.map((item) => [item.company, {
            name: item.company,
            logoUrl: item.companyLogoUrl,
            count: items.filter((candidate) => candidate.company === item.company).length,
          }])).values()];
          const selected = isSameMonth(calendarMonth, month);
          return (
            <button
              className={cn("month-overview-card", selected && "is-selected")}
              key={calendarMonth.getMonth()}
              onClick={() => onSelectMonth(calendarMonth)}
              aria-pressed={selected}
              aria-label={`${new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(calendarMonth)}, ${items.length} milestones`}
            >
              <span className="month-overview-label">
                <strong>{new Intl.DateTimeFormat("en-GB", { month: "long" }).format(calendarMonth)}</strong>
                <small>{items.length || "—"}</small>
              </span>
              <span className="month-company-bars">
                {companies.slice(0, 3).map((company) => (
                  <span className="month-company-bar" key={company.name}>
                    <CompanyLogo name={company.name} logoUrl={company.logoUrl} mini />
                    <b>{company.name}</b>
                    {company.count > 1 && <i>{company.count}</i>}
                  </span>
                ))}
                {companies.length > 3 && <span className="month-company-more">+{companies.length - 3} more companies</span>}
                {!companies.length && <span className="month-company-empty">No deadlines</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeadlineList({ deadlines, scope }: { deadlines: DeadlineRow[]; scope: Scope }) {
  if (!deadlines.length) {
    return <div className="deadline-empty"><CalendarClock size={24} /><strong>No {scope} deadlines</strong><span>Add milestones to opportunities or applications.</span></div>;
  }

  return (
    <div className="deadline-list-view">
      {deadlines.map((item, index) => {
        const urgency = urgencyFor(item.date);
        const date = new Date(item.date);
        const previous = deadlines[index - 1];
        const showMonth = index === 0 || !isSameMonth(date, new Date(previous.date));
        return (
          <div className={cn("deadline-list-row", urgency)} key={item.id}>
            <span className="deadline-list-month">{showMonth ? new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(date) : ""}</span>
            <time><b>{date.getDate().toString().padStart(2, "0")}</b><small>{new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date)}</small></time>
            <CompanyLogo name={item.company} logoUrl={item.companyLogoUrl} />
            <div className="deadline-copy">
              <span>{item.source} · {item.status}</span>
              <strong>{item.name}</strong>
              <small>{item.company} · {item.opportunity}</small>
            </div>
            <span className="countdown-badge"><i />{countdown(item.date)}</span>
            <Link to={item.source === "Opportunity" ? "/opportunities" : "/applications"} search={{record:item.recordId} as never} aria-label={`Open ${item.source}`}><ChevronRight size={16} /></Link>
          </div>
        );
      })}
    </div>
  );
}

function AgendaItem({ item }: { item: DeadlineRow }) {
  return (
    <Link to={item.source === "Opportunity" ? "/opportunities" : "/applications"} search={{record:item.recordId} as never} className="calendar-agenda-item">
      <CompanyLogo name={item.company} logoUrl={item.companyLogoUrl} />
      <div><span>{item.source} · {item.status}</span><strong>{item.name}</strong><small>{item.company} · {item.opportunity}</small></div>
      <ChevronRight size={15} />
    </Link>
  );
}

function CompanyLogo({ name, logoUrl, mini = false }: { name: string; logoUrl?: string | null; mini?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cn("deadline-company-logo", mini && "is-mini")} title={name}>
      {logoUrl && !failed ? <img src={logoUrl} alt="" onError={() => setFailed(true)} /> : <b>{initials(name)}</b>}
    </span>
  );
}

function matchesScope(item: DeadlineRow, scope: Scope, today: number) {
  return scope === "all" || (scope === "past" ? item.date < today : item.date >= today);
}

function startOfToday() { const date = new Date(); date.setHours(0, 0, 0, 0); return date.getTime(); }
function daysBetween(timestamp: number) { return Math.ceil((timestamp - startOfToday()) / 86_400_000); }
function countdown(timestamp: number) { const days = daysBetween(timestamp); if (days === 0) return "Today"; if (days === 1) return "Tomorrow"; if (days > 1) return `${days} days`; const passed = Math.abs(days); return passed === 1 ? "1 day ago" : `${passed} days ago`; }
function urgencyFor(timestamp: number) { const days = daysBetween(timestamp); return days < 0 ? "passed" : days <= 3 ? "urgent" : days <= 14 ? "soon" : "upcoming"; }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function isSameMonth(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"; }
function capitalize(value: string) { return value[0].toUpperCase() + value.slice(1); }
function formatFullDate(timestamp: number) { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(timestamp); }

function DeadlineSkeleton() {
  return <div className="deadline-skeleton">{Array.from({ length: 5 }).map((_, index) => <div key={index}><i /><span /><b /></div>)}</div>;
}

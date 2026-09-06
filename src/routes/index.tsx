import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCheck,
  Circle,
  FileText,
  Plus,
  Trophy,
} from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { buildFocusQueue, collectDeadlines, relativeDue } from "@/lib/overview";

export const Route = createFileRoute("/")({ component: OverviewPage });
function OverviewPage() {
  const { user } = useAuth();
  const args = user ? { workosUserId: user.id } : ("skip" as const);
  const companies = useQuery(api.companies.list, args);
  const opportunities = useQuery(api.opportunities.list, args);
  const applications = useQuery(api.applications.list, args);
  const [scope, setScope] = useState("All");
  if (!companies || !opportunities || !applications)
    return (
      <div className="overview-loading" role="status">
        Loading your workspace…
        <div />
        <div />
        <div />
      </div>
    );
  const active = applications.filter(
    (item) =>
      !item.archived &&
      !["Rejected", "Withdrawn", "Offer"].includes(item.status),
  );
  const focus = buildFocusQueue(applications, opportunities);
  const filtered = focus.filter(
    (item) =>
      scope === "All" ||
      (scope === "Applications"
        ? item.kind === "Application"
        : item.kind === "Research"),
  );
  const deadlines = collectDeadlines(applications, opportunities).slice(0, 5);
  const ranked = companies
    .filter((item) => !item.archived && item.overallScore !== undefined)
    .sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0))
    .slice(0, 4);
  const research = opportunities
    .filter((item) => !item.archived)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);
  const stages = [
    {
      label: "Preparing",
      count: active.filter((item) =>
        ["Not Started", "Interested", "Preparing"].includes(item.status),
      ).length,
    },
    {
      label: "Applied",
      count: active.filter((item) => item.status === "Applied").length,
    },
    {
      label: "Assessment",
      count: active.filter((item) => item.status === "Assessment").length,
    },
    {
      label: "Interview",
      count: active.filter((item) => item.status === "Interview").length,
    },
    {
      label: "Offers",
      count: applications.filter(
        (item) => !item.archived && item.status === "Offer",
      ).length,
    },
  ];
  const other = active.filter(
    (item) =>
      ![
        "Not Started",
        "Interested",
        "Preparing",
        "Applied",
        "Assessment",
        "Interview",
      ].includes(item.status),
  ).length;
  if (other) stages.splice(4, 0, { label: "Other stages", count: other });
  return (
    <div className="overview-page">
      <header className="overview-heading">
        <div>
          <h1>Your next move.</h1>
          <p>
            {user?.firstName ? `${user.firstName}, here’s` : "Here’s"} what’s
            happening across your career search.
          </p>
        </div>
        <time>
          {new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }).format(new Date())}
        </time>
      </header>
      <section className="overview-pipeline" aria-label="Application progress">
        <Link to="/applications" className="pipeline-total">
          <strong>{active.length}</strong>
          <span>
            Active applications
            <small>
              View your pipeline <ArrowUpRight size={12} />
            </small>
          </span>
        </Link>
        <div className="pipeline-stages">
          {stages.map((stage) => (
            <div key={stage.label}>
              <span>{stage.label}</span>
              <strong>{stage.count}</strong>
              <i>
                <b
                  style={{
                    width: `${Math.min(100, (stage.count / Math.max(1, active.length)) * 100)}%`,
                  }}
                />
              </i>
            </div>
          ))}
        </div>
      </section>
      {companies.length === 0 && (
        <section className="onboarding-strip">
          <span className="onboarding-icon">
            <Building2 size={23} />
          </span>
          <div>
            <h2>Start with a company you’re curious about.</h2>
            <p>
              Add a company, save an opportunity, then track your application
              here.
            </p>
          </div>
          <Link
            to="/companies"
            search={{ new: 1 } as never}
            className="primary-link"
          >
            <Plus size={15} /> Add your first company
          </Link>
        </section>
      )}
      <div className="overview-columns">
        <div className="overview-primary">
          <section className="focus-section">
            <header className="section-heading">
              <div>
                <h2>
                  Needs your attention{" "}
                  <span className="quiet-count">{focus.length}</span>
                </h2>
                <p>
                  Next actions and research reminders due within seven days.
                </p>
              </div>
            </header>
            <div className="view-tabs" aria-label="Attention filter">
              {["All", "Applications", "Research"].map((value) => (
                <button
                  key={value}
                  aria-pressed={scope === value}
                  className={scope === value ? "active" : ""}
                  onClick={() => setScope(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="focus-list">
              {filtered.length ? (
                filtered.slice(0, 8).map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    search={{ record: item.recordId } as never}
                    className="focus-row"
                  >
                    <span
                      className={`focus-marker ${item.overdue ? "is-overdue" : ""}`}
                    >
                      {item.kind === "Application" ? (
                        <Circle size={17} />
                      ) : (
                        <Building2 size={17} />
                      )}
                    </span>
                    <span className="focus-copy">
                      <strong>{item.title}</strong>
                      <small>
                        {item.company} <span className="text-separator">/</span>{" "}
                        {item.subtitle}
                      </small>
                    </span>
                    <span
                      className={`focus-due ${item.overdue ? "is-overdue" : ""}`}
                    >
                      {item.date ? relativeDue(item.date) : "Set next action"}
                    </span>
                    <ArrowUpRight size={15} />
                  </Link>
                ))
              ) : (
                <div className="calm-empty">
                  <CheckCheck size={26} />
                  <h3>You’re up to date</h3>
                  <p>
                    {scope === "All"
                      ? "No actions are due this week. Explore an opportunity or plan your next application."
                      : `No ${scope.toLowerCase()} need attention this week.`}
                  </p>
                  <Link to="/opportunities">
                    Explore opportunities <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
            {filtered.length > 8 && (
              <p className="section-footnote">
                Showing the next 8 of {filtered.length} items. Open Applications
                or Opportunities for the full list.
              </p>
            )}
          </section>
          <section className="recent-section">
            <header className="section-heading">
              <div>
                <h2>Continue your research</h2>
                <p>Pick up where you left off.</p>
              </div>
              <Link to="/opportunities">
                All opportunities <ArrowUpRight size={14} />
              </Link>
            </header>
            {research.length ? (
              <div className="research-list">
                {research.map((item) => (
                  <Link
                    key={item._id}
                    to="/opportunities"
                    search={{ record: item._id } as never}
                  >
                    <span className="entity-monogram">
                      {item.company?.name?.slice(0, 2) ?? "OP"}
                    </span>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.company?.name}</small>
                    </span>
                    <span className="research-status">{item.status}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="inline-empty">
                <Building2 size={18} />
                <p>Save programmes, roles, and source links as you research.</p>
                <Link to="/opportunities" search={{ new: 1 } as never}>
                  Add opportunity
                </Link>
              </div>
            )}
          </section>
        </div>
        <aside className="overview-secondary">
          <section className="upcoming-section">
            <header className="section-heading">
              <h2>
                <CalendarDays size={17} /> Coming up
              </h2>
              <Link to="/deadlines" aria-label="Open deadlines">
                <ArrowUpRight size={16} />
              </Link>
            </header>
            {deadlines.length ? (
              <div className="upcoming-list">
                {deadlines.map((item) => (
                  <Link
                    key={item.id}
                    to={item.to}
                    search={{ record: item.recordId } as never}
                  >
                    <time>
                      <strong>{new Date(item.date).getDate()}</strong>
                      <span>
                        {new Intl.DateTimeFormat("en-GB", {
                          month: "short",
                        }).format(item.date)}
                      </span>
                    </time>
                    <span>
                      <strong>{item.name}</strong>
                      <small>{item.company}</small>
                      <em>{relativeDue(item.date)}</em>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="aside-empty">
                <p>No upcoming deadlines.</p>
                <span>
                  Add a deadline to an opportunity or application and it will
                  appear here.
                </span>
              </div>
            )}
            <Link to="/deadlines" className="section-footer-link">
              Open calendar <ArrowRight size={14} />
            </Link>
          </section>
          <section className="shortlist-section">
            <header className="section-heading">
              <h2>
                <Trophy size={17} /> Your top companies
              </h2>
              <Link to="/rankings" aria-label="Open rankings">
                <ArrowUpRight size={16} />
              </Link>
            </header>
            {ranked.length ? (
              <div className="shortlist-rows">
                {ranked.map((item, index) => (
                  <Link
                    key={item._id}
                    to="/companies"
                    search={{ record: item._id } as never}
                  >
                    <span>{index + 1}</span>
                    <strong>{item.name}</strong>
                    <b>
                      {Math.round(item.overallScore ?? 0)}
                      <small>/100</small>
                    </b>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="aside-empty">
                <p>Your shortlist starts with a score.</p>
                <span>
                  Rate companies on what matters to you, then compare them in
                  Rankings.
                </span>
              </div>
            )}
            <Link to="/rankings" className="section-footer-link">
              Compare rankings <ArrowRight size={14} />
            </Link>
          </section>
          <Link
            className="overview-add-application"
            to="/applications"
            search={{ new: 1 } as never}
          >
            <FileText size={18} />
            <span>
              Found your next opportunity?<strong>Track an application</strong>
            </span>
            <Plus size={17} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

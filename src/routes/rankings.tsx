import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { ArrowUpRight, Search, SlidersHorizontal, Trophy } from "lucide-react";
import { api } from "../../convex/_generated/api";
export const Route = createFileRoute("/rankings")({ component: RankingsPage });
function RankingsPage() {
  const { user } = useAuth();
  const args = user ? { workosUserId: user.id } : ("skip" as const);
  const companies = useQuery(api.companies.list, args);
  const opportunities = useQuery(api.opportunities.list, args);
  const [entity, setEntity] = useState("Companies");
  const [search, setSearch] = useState("");
  const [ratedOnly, setRatedOnly] = useState(true);
  const source = entity === "Companies" ? companies : opportunities;
  const rows = (source ?? [])
    .filter(
      (item) =>
        !item.archived &&
        (!ratedOnly || item.overallScore !== undefined) &&
        item.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        (b.overallScore ?? -1) - (a.overallScore ?? -1) ||
        a.name.localeCompare(b.name),
    );
  return (
    <div className="rankings-page">
      <header className="page-command">
        <div>
          <h1>Rankings</h1>
          <p>Compare your options by what matters to you.</p>
        </div>
        <Link
          className="secondary-link"
          to="/settings"
          search={{ section: "ratings" } as never}
        >
          <SlidersHorizontal size={15} /> Scoring criteria
        </Link>
      </header>
      <div className="view-tabs">
        {["Companies", "Opportunities"].map((value) => (
          <button
            key={value}
            className={entity === value ? "active" : ""}
            aria-pressed={entity === value}
            onClick={() => setEntity(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="ranking-explainer">
        <Trophy size={18} />
        <p>
          Your scores, your priorities. Open a record to adjust its rating.
          Unrated records appear at the end when included.
        </p>
      </div>
      <section className="records-shell">
        <div className="table-toolbar">
          <label className="table-search">
            <Search size={16} />
            <input
              aria-label="Search rankings"
              placeholder="Find in rankings…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="ranking-unrated">
            <input
              type="checkbox"
              checked={!ratedOnly}
              onChange={(event) => setRatedOnly(!event.target.checked)}
            />{" "}
            Include unrated
          </label>
        </div>
        {source === undefined ? (
          <div className="calm-empty" role="status">
            Loading rankings…
          </div>
        ) : rows.length ? (
          <div className="ranking-table">
            <div className="ranking-table-heading">
              <span>Rank</span>
              <span>{entity === "Companies" ? "Company" : "Opportunity"}</span>
              <span>Score</span>
              <span />
            </div>
            {rows.map((item, index) => (
              <Link
                key={item._id}
                to={entity === "Companies" ? "/companies" : "/opportunities"}
                search={{ record: item._id } as never}
                className="ranking-row"
              >
                <span className="ranking-position">
                  {item.overallScore !== undefined ? index + 1 : "—"}
                </span>
                <span className="ranking-identity">
                  <span className="entity-monogram">
                    {item.name.slice(0, 2)}
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>
                      {"websiteUrl" in item
                        ? item.websiteUrl
                        : item.company?.name}
                    </small>
                  </span>
                </span>
                <span className="ranking-score">
                  <i>
                    <b style={{ width: `${item.overallScore ?? 0}%` }} />
                  </i>
                  <strong>
                    {item.overallScore !== undefined
                      ? Math.round(item.overallScore)
                      : "—"}
                  </strong>
                  <small>/ 100</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="calm-empty">
            <Trophy size={27} />
            <h3>
              {search ? "No matching results" : "Build your personal shortlist"}
            </h3>
            <p>
              {search
                ? "Try another name or include unrated records."
                : "Add a score to a company or opportunity to see it ranked here."}
            </p>
            <Link to={entity === "Companies" ? "/companies" : "/opportunities"}>
              Explore {entity.toLowerCase()} <ArrowRightIcon />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
function ArrowRightIcon() {
  return <ArrowUpRight size={14} />;
}

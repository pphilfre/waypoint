import { createFileRoute } from "@tanstack/react-router";
import { OpportunityWorkspace } from "@/components/opportunities/OpportunityWorkspace";

export const Route = createFileRoute("/opportunities")({
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  return <OpportunityWorkspace />;
}

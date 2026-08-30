import { createFileRoute } from "@tanstack/react-router";
import { CompanyWorkspace } from "@/components/companies/CompanyWorkspace";

export const Route = createFileRoute("/companies")({
  component: CompaniesPage,
});

function CompaniesPage() {
  return <CompanyWorkspace />;
}

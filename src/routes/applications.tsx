import { createFileRoute } from "@tanstack/react-router";
import { ApplicationWorkspace } from "@/components/applications/ApplicationWorkspace";

export const Route = createFileRoute("/applications")({
  component: ApplicationsPage,
});

function ApplicationsPage() {
  return <ApplicationWorkspace />;
}

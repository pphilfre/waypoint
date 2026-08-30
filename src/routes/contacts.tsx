import { createFileRoute } from "@tanstack/react-router";
import { ContactWorkspace } from "@/components/contacts/ContactWorkspace";

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
});

function ContactsPage() {
  return <ContactWorkspace />;
}

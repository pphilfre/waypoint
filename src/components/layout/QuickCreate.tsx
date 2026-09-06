import { Link } from "@tanstack/react-router";
import {
  Building2,
  BriefcaseBusiness,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickCreate() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="quick-create">
          <Plus size={16} /> New
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {[
          { to: "/companies", label: "Company", icon: Building2 },
          {
            to: "/opportunities",
            label: "Opportunity",
            icon: BriefcaseBusiness,
          },
          { to: "/applications", label: "Application", icon: FileText },
          { to: "/contacts", label: "Contact", icon: Users },
        ].map(({ to, label, icon: Icon }) => (
          <DropdownMenuItem key={to} asChild>
            <Link to={to} search={{ new: 1 } as never}>
              <Icon size={15} />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

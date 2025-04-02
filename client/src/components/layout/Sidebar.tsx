import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Search,
  Wand2, 
  Users, 
  Building2, 
  Bot, 
  ListChecks, 
  BarChart3, 
  HelpCircle,
  FileText,
  Database
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const [location] = useLocation();
  
  // Fetch contact and company counts
  const { data: contactsData } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
    staleTime: 60000 // 1 minute
  });
  
  const { data: companiesData } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
    staleTime: 60000 // 1 minute
  });
  
  const contactCount = contactsData?.contacts?.length || 0;
  const companyCount = companiesData?.companies?.length || 0;
  
  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} className="w-5" />,
    },
    {
      href: "/dashboard/enrich",
      label: "Enrich Data",
      icon: <Wand2 size={18} className="w-5" />,
    },
    {
      href: "/dashboard/contacts",
      label: "My Contacts",
      icon: <Users size={18} className="w-5" />,
      count: contactCount,
    },
    {
      href: "/dashboard/companies",
      label: "Companies",
      icon: <Building2 size={18} className="w-5" />,
      count: companyCount,
    },
    {
      href: "/dashboard/ai-writer",
      label: "AI Writer",
      icon: <Bot size={18} className="w-5" />,
    },
    {
      href: "/dashboard/crm-integrations",
      label: "CRM Integrations",
      icon: <Database size={18} className="w-5" />,
    },
    {
      href: "/dashboard/contact-list",
      label: "Contact Lists",
      icon: <ListChecks size={18} className="w-5" />,
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: <BarChart3 size={18} className="w-5" />,
    },
  ];

  return (
    <aside 
      className={cn(
        "fixed inset-y-0 left-0 pt-14 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out z-10",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-3">
          <Link href="/dashboard/enrich">
            <div>
              <Button className="flex items-center justify-between w-full px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition">
                <span className="font-medium">Find Leads</span>
                <Search size={16} />
              </Button>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 px-2 py-3 overflow-y-auto">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-4 py-2 rounded-md cursor-pointer",
                  location === item.href
                    ? "bg-neutral-100 text-primary-500 font-medium"
                    : "text-neutral-600 hover:bg-neutral-100"
                )}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
                {item.count !== undefined && (
                  <span className={cn(
                    "ml-auto text-xs font-medium px-2 py-1 rounded-full",
                    location === item.href || item.count > 0
                      ? "bg-primary-100 text-primary-600"
                      : "bg-neutral-100 text-neutral-600"
                  )}>
                    {item.count}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-neutral-200">
          <div className="rounded-md bg-neutral-50 p-3">
            <div className="flex items-center">
              <div className="mr-3 flex-shrink-0">
                <HelpCircle size={18} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-800">Need help?</p>
                <p className="text-xs text-neutral-600 mt-1">Check our documentation or contact support</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-2 w-full text-xs py-1.5 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            >
              <FileText size={12} className="mr-1" />
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

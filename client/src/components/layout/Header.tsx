import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreditsIndicator } from "@/components/billing/CreditsIndicator";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import { UserDropdown } from "@/components/profile/UserDropdown";

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log(`Searching for: ${searchQuery}`);
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200 fixed w-full z-10">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-neutral-600 hover:bg-neutral-100 lg:hidden"
          >
            <Menu size={20} />
          </button>
          <Link href="/dashboard">
            <div className="ml-2 lg:ml-0 font-semibold text-lg text-primary-600 cursor-pointer">AI-CRM</div>
          </Link>
        </div>
        
        <div className="flex-1 max-w-3xl mx-4 hidden md:block">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for contacts, companies or messages..." 
                className="w-full pl-10 pr-4 py-2" 
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-neutral-400" />
              </div>
            </div>
          </form>
        </div>
        
        <div className="flex items-center space-x-3">
          <CreditsIndicator />
          <NotificationsPopover />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}

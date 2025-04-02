import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Bell, 
  Search, 
  ChevronDown, 
  Menu, 
  Coins,
  LogOut,
  Settings,
  User as UserIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { user, logout } = useAuth();
  
  // Query for user's credit balance
  const { data: creditsData } = useQuery({
    queryKey: ["/api/user/credits"],
    queryFn: async () => {
      const res = await fetch("/api/user/credits", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch credits");
      return res.json();
    }
  });
  
  const credits = creditsData?.credits || user?.credits || 0;
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

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
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search for contacts, companies or messages..." 
              className="w-full pl-10 pr-4 py-2" 
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-neutral-400" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-neutral-100 rounded-full px-3 py-1 text-sm">
            <Coins size={14} className="text-primary-500 mr-1" />
            <span className="text-primary-500">{credits}</span>
            <span className="text-neutral-500 ml-1">credits</span>
          </div>
          
          <div className="relative">
            <button className="relative p-1 rounded-full text-neutral-600 hover:bg-neutral-100">
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              <Bell size={18} />
            </button>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center space-x-2 p-1 rounded-md hover:bg-neutral-100">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-500 text-white text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline-block text-sm font-medium">
                  {user?.fullName || "User"}
                </span>
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

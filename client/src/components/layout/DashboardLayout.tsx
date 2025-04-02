import { useState, ReactNode } from "react";
import { useLocation, useRoute } from "wouter";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { useAuth } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const [, params] = useRoute("/dashboard/:path*");
  const [location] = useLocation();
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Close sidebar when clicking outside on mobile
  const handleMainClick = () => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
          <h2 className="text-xl font-medium text-neutral-700">Loading...</h2>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated && !location.startsWith("/login") && !location.startsWith("/signup")) {
    // Redirect is handled by the ProtectedRoute component
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} />
      
      <main 
        className="flex-1 ml-0 lg:ml-64 pt-14 min-h-screen" 
        onClick={handleMainClick}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

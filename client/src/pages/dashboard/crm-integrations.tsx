import { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CRMIntegrations } from "@/components/crm/CRMIntegrations";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function CRMIntegrationsPage() {
  const { toast } = useToast();
  
  // Check if the user is authenticated
  const { 
    data: userData, 
    isLoading: isLoadingUser, 
    error: userError 
  } = useQuery({ 
    queryKey: ['/api/user/profile']
  });

  // Show error toast if user data fails to load
  useEffect(() => {
    if (userError) {
      toast({
        title: "Authentication Error",
        description: "Please log in to access this page",
        variant: "destructive"
      });
    }
  }, [userError, toast]);

  // Loading state
  if (isLoadingUser) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // If user is authenticated, show the CRM integration page
  return (
    <DashboardLayout>
      <div className="container py-6">
        <CRMIntegrations />
      </div>
    </DashboardLayout>
  );
}
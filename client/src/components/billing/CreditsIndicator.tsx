import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Coins, Plus, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

export function CreditsIndicator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
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
  const creditPackages = [
    { id: 1, name: "Starter", credits: 50, price: 9.99 },
    { id: 2, name: "Pro", credits: 200, price: 29.99 },
    { id: 3, name: "Business", credits: 500, price: 59.99 },
  ];

  const handleBuyCredits = (packageId: number) => {
    // This would typically connect to a payment processor
    toast({
      title: "Coming Soon",
      description: "Credit purchases will be available soon",
    });
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 mr-2 border-neutral-200 px-3">
          <Coins size={14} className="text-primary-500 mr-1" />
          <span className="text-primary-500 font-medium">{credits}</span>
          <span className="text-neutral-500 ml-1 mr-1">credits</span>
          <span className="text-xs text-primary-500"><Plus size={12} /></span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Your Credits</h4>
            <span className="flex items-center text-primary-500 font-medium">
              <Coins size={14} className="mr-1" />
              {credits} credits
            </span>
          </div>
          
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-neutral-600">Credit Packages</h5>
            <div className="grid gap-2">
              {creditPackages.map((pkg) => (
                <div 
                  key={pkg.id}
                  className="flex items-center justify-between p-3 border rounded-md hover:border-primary-300 hover:bg-neutral-50 cursor-pointer"
                  onClick={() => handleBuyCredits(pkg.id)}
                >
                  <div>
                    <h6 className="font-medium">{pkg.name}</h6>
                    <p className="text-sm text-neutral-500">{pkg.credits} credits</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${pkg.price}</p>
                    <p className="text-xs text-neutral-500">${(pkg.price / pkg.credits).toFixed(2)} per credit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Button className="w-full">
            <CreditCard size={16} className="mr-2" />
            Buy Credits
          </Button>
          
          <div className="text-xs text-neutral-500">
            Credits are used for AI features, data enrichment, and CRM integrations
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
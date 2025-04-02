import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { SiSalesforce, SiHubspot } from "react-icons/si";
import { AlertCircle, Check, RefreshCw, Upload, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

// CRM Types and constants
export enum CRMType {
  Salesforce = 'salesforce',
  HubSpot = 'hubspot'
}

interface CRMConnectionStatus {
  type: CRMType;
  connected: boolean;
  message: string;
}

export function CRMIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCRM, setActiveCRM] = useState<CRMType>(CRMType.Salesforce);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch connection status
  const { 
    data: connectionData, 
    isLoading: isLoadingStatus,
    refetch: refetchStatus
  } = useQuery({ 
    queryKey: ['/api/crm/connection/status'],
    refetchOnWindowFocus: false
  });

  // Import contacts mutation
  const importContactsMutation = useMutation({
    mutationFn: async (source: CRMType) => {
      setIsImporting(true);
      return apiRequest('/api/crm/import/contacts', {
        method: 'POST',
        body: JSON.stringify({ source })
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import Successful",
        description: `${data.count} contacts imported successfully. Used ${data.creditsUsed} credits.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import contacts. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsImporting(false);
    }
  });

  // Import companies mutation
  const importCompaniesMutation = useMutation({
    mutationFn: async (source: CRMType) => {
      setIsImporting(true);
      return apiRequest('/api/crm/import/companies', {
        method: 'POST',
        body: JSON.stringify({ source })
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import Successful",
        description: `${data.count} companies imported successfully. Used ${data.creditsUsed} credits.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/credits'] });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import companies. Please try again.",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsImporting(false);
    }
  });

  // Get connections from the data
  const connections: CRMConnectionStatus[] = connectionData?.connections || [];
  const salesforceConnection = connections.find(c => c.type === CRMType.Salesforce);
  const hubspotConnection = connections.find(c => c.type === CRMType.HubSpot);

  // Render the status badge for each CRM
  const renderStatusBadge = (connected: boolean) => {
    if (connected) {
      return <Badge variant="outline" className="ml-2 bg-green-600 text-white"><Check className="w-3.5 h-3.5 mr-1" /> Connected</Badge>;
    }
    return <Badge variant="destructive" className="ml-2"><AlertCircle className="w-3.5 h-3.5 mr-1" /> Not Connected</Badge>;
  };

  // Handle the refresh connection status
  const handleRefreshStatus = () => {
    refetchStatus();
  };

  // Handle import actions
  const handleImportContacts = () => {
    importContactsMutation.mutate(activeCRM);
  };

  const handleImportCompanies = () => {
    importCompaniesMutation.mutate(activeCRM);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">CRM Integrations</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshStatus}
          disabled={isLoadingStatus}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      <p className="text-muted-foreground">
        Connect and manage your CRM data. Import contacts and companies or export your existing data to your preferred CRM platform.
      </p>

      <Tabs defaultValue="salesforce" onValueChange={(value) => setActiveCRM(value as CRMType)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="salesforce" className="flex items-center justify-center">
            <SiSalesforce className="w-5 h-5 mr-2" />
            Salesforce
            {salesforceConnection && renderStatusBadge(salesforceConnection.connected)}
          </TabsTrigger>
          <TabsTrigger value="hubspot" className="flex items-center justify-center">
            <SiHubspot className="w-5 h-5 mr-2" />
            HubSpot
            {hubspotConnection && renderStatusBadge(hubspotConnection.connected)}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="salesforce" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SiSalesforce className="w-6 h-6 mr-2 text-blue-600" />
                Salesforce Integration
              </CardTitle>
              <CardDescription>
                Connect to Salesforce to sync your contacts and companies data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Connection Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {salesforceConnection?.message || "Status unknown"}
                    </p>
                  </div>
                  {salesforceConnection && renderStatusBadge(salesforceConnection.connected)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="flex space-x-2 w-full">
                <Button 
                  className="flex-1"
                  onClick={handleImportContacts}
                  disabled={!salesforceConnection?.connected || isImporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import Contacts
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleImportCompanies}
                  disabled={!salesforceConnection?.connected || isImporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import Companies
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Import operations cost 10 credits. Make sure you have enough credits before proceeding.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="hubspot" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SiHubspot className="w-6 h-6 mr-2 text-orange-500" />
                HubSpot Integration
              </CardTitle>
              <CardDescription>
                Connect to HubSpot to sync your contacts and companies data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Connection Status</h3>
                    <p className="text-sm text-muted-foreground">
                      {hubspotConnection?.message || "Status unknown"}
                    </p>
                  </div>
                  {hubspotConnection && renderStatusBadge(hubspotConnection.connected)}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="flex space-x-2 w-full">
                <Button 
                  className="flex-1"
                  onClick={handleImportContacts}
                  disabled={!hubspotConnection?.connected || isImporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import Contacts
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleImportCompanies}
                  disabled={!hubspotConnection?.connected || isImporting}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import Companies
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Import operations cost 10 credits. Make sure you have enough credits before proceeding.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Export your contacts or companies to your selected CRM system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select records to export from your contacts or companies pages. Export operations cost 5 credits.
          </p>
          <div className="flex space-x-2">
            <Link href="/dashboard/contacts">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Go to Contacts
              </Button>
            </Link>
            <Link href="/dashboard/companies">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Go to Companies
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
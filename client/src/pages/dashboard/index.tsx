import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, Users, Building2, Bot, Zap, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Fetch user's credit balance
  const { data: creditsData, isLoading: isLoadingCredits } = useQuery({
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
  
  // Fetch user's contacts
  const { data: contactsData, isLoading: isLoadingContacts } = useQuery({
    queryKey: ["/api/contacts"],
    queryFn: async () => {
      const res = await fetch("/api/contacts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    }
  });
  
  // Fetch user's companies
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["/api/companies"],
    queryFn: async () => {
      const res = await fetch("/api/companies", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    }
  });
  
  // Sample data for charts
  const activityData = [
    { name: 'Mon', searches: 5, enrichments: 10, messages: 3 },
    { name: 'Tue', searches: 8, enrichments: 15, messages: 7 },
    { name: 'Wed', searches: 12, enrichments: 18, messages: 9 },
    { name: 'Thu', searches: 6, enrichments: 12, messages: 5 },
    { name: 'Fri', searches: 10, enrichments: 14, messages: 8 },
    { name: 'Sat', searches: 2, enrichments: 4, messages: 1 },
    { name: 'Sun', searches: 1, enrichments: 3, messages: 0 },
  ];
  
  const contactsByIndustry = [
    { name: 'Technology', value: 45 },
    { name: 'Finance', value: 20 },
    { name: 'Healthcare', value: 15 },
    { name: 'Manufacturing', value: 10 },
    { name: 'Other', value: 10 },
  ];
  
  const COLORS = ['#4F46E5', '#3B82F6', '#10B981', '#6366F1', '#8B5CF6'];
  
  const creditLimit = 200;
  const credits = creditsData?.credits || user?.credits || 0;
  const creditPercentage = (credits / creditLimit) * 100;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Dashboard</h1>
        <p className="text-neutral-600">Welcome back, {user?.fullName}! Here's an overview of your CRM activity.</p>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-500">Available Credits</p>
                {isLoadingCredits ? (
                  <Loader2 className="h-5 w-5 text-neutral-400 animate-spin" />
                ) : (
                  <p className="text-3xl font-bold">{credits}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary-100 text-primary-500 flex items-center justify-center">
                <Zap size={24} />
              </div>
            </div>
            <Progress 
              className="h-2 mt-4" 
              value={creditPercentage} 
              color="bg-primary-500" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-500">Total Contacts</p>
                {isLoadingContacts ? (
                  <Loader2 className="h-5 w-5 text-neutral-400 animate-spin" />
                ) : (
                  <p className="text-3xl font-bold">{contactsData?.contacts?.length || 0}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-4 text-sm text-neutral-500">
              <TrendingUp className="inline h-4 w-4 mr-1 text-green-500" />
              <span>2 new contacts this week</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-500">Companies</p>
                {isLoadingCompanies ? (
                  <Loader2 className="h-5 w-5 text-neutral-400 animate-spin" />
                ) : (
                  <p className="text-3xl font-bold">{companiesData?.companies?.length || 0}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 text-green-500 flex items-center justify-center">
                <Building2 size={24} />
              </div>
            </div>
            <div className="mt-4 text-sm text-neutral-500">
              <TrendingUp className="inline h-4 w-4 mr-1 text-green-500" />
              <span>Active in 3 industries</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-500">AI Messages</p>
                <p className="text-3xl font-bold">12</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 text-purple-500 flex items-center justify-center">
                <Bot size={24} />
              </div>
            </div>
            <div className="mt-4 text-sm text-neutral-500">
              <TrendingUp className="inline h-4 w-4 mr-1 text-green-500" />
              <span>75% increase from last week</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your CRM activities for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activityData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="searches" name="Searches" fill="#4F46E5" />
                  <Bar dataKey="enrichments" name="Enrichments" fill="#3B82F6" />
                  <Bar dataKey="messages" name="AI Messages" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Contacts by Industry</CardTitle>
            <CardDescription>Distribution of your contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contactsByIndustry}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {contactsByIndustry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest CRM activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="searches">Searches</TabsTrigger>
                <TabsTrigger value="contacts">Contacts</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-4">
                <div className="border-l-4 border-primary-500 pl-4 py-2">
                  <p className="text-sm font-medium">Email revealed for Sarah Johnson</p>
                  <p className="text-xs text-neutral-500">2 minutes ago</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-medium">New contact added: Robert Miller</p>
                  <p className="text-xs text-neutral-500">1 hour ago</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="text-sm font-medium">Lead search: "VP of Marketing - TechCorp"</p>
                  <p className="text-xs text-neutral-500">3 hours ago</p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="text-sm font-medium">AI message generated for Jennifer Lee</p>
                  <p className="text-xs text-neutral-500">Yesterday at 4:32 PM</p>
                </div>
                
                <div className="border-l-4 border-yellow-500 pl-4 py-2">
                  <p className="text-sm font-medium">Added new company: GlobalFinance Ltd.</p>
                  <p className="text-xs text-neutral-500">Yesterday at 2:15 PM</p>
                </div>
              </TabsContent>
              
              <TabsContent value="searches" className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="text-sm font-medium">Lead search: "VP of Marketing - TechCorp"</p>
                  <p className="text-xs text-neutral-500">3 hours ago</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <p className="text-sm font-medium">Lead search: "CTO - InnovateSoft"</p>
                  <p className="text-xs text-neutral-500">2 days ago</p>
                </div>
              </TabsContent>
              
              <TabsContent value="contacts" className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-medium">New contact added: Robert Miller</p>
                  <p className="text-xs text-neutral-500">1 hour ago</p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm font-medium">Email revealed for Sarah Johnson</p>
                  <p className="text-xs text-neutral-500">2 minutes ago</p>
                </div>
              </TabsContent>
              
              <TabsContent value="messages" className="space-y-4">
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <p className="text-sm font-medium">AI message generated for Jennifer Lee</p>
                  <p className="text-xs text-neutral-500">Yesterday at 4:32 PM</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-between" variant="outline" asChild>
              <a href="/dashboard/enrich">
                Find and enrich leads <ArrowRight size={16} />
              </a>
            </Button>
            
            <Button className="w-full justify-between" variant="outline" asChild>
              <a href="/dashboard/ai-writer">
                Create AI message <ArrowRight size={16} />
              </a>
            </Button>
            
            <Button className="w-full justify-between" variant="outline" asChild>
              <a href="/dashboard/contacts">
                Manage contacts <ArrowRight size={16} />
              </a>
            </Button>
            
            <Button className="w-full justify-between" variant="outline" asChild>
              <a href="/dashboard/companies">
                View companies <ArrowRight size={16} />
              </a>
            </Button>
            
            <div className="bg-neutral-50 rounded-lg p-4 mt-6">
              <h4 className="font-medium text-sm mb-2">Need more credits?</h4>
              <p className="text-xs text-neutral-600 mb-3">Upgrade your plan to get more credits and features</p>
              <Button className="w-full" size="sm">
                Buy Credits
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

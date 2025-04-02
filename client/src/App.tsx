import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import EnrichPage from "@/pages/dashboard/enrich";
import ContactsPage from "@/pages/dashboard/contacts";
import CompaniesPage from "@/pages/dashboard/companies";
import AiWriterPage from "@/pages/dashboard/ai-writer";
import ContactListPage from "@/pages/dashboard/contact-list";
import CRMIntegrationsPage from "@/pages/dashboard/crm-integrations";
import DashboardLayout from "@/components/layout/DashboardLayout";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [location, setLocation] = useLocation();
  const isAuthenticated = localStorage.getItem("authToken");

  if (!isAuthenticated) {
    setLocation("/login");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/dashboard" component={() => (
        <DashboardLayout>
          <ProtectedRoute component={Dashboard} />
        </DashboardLayout>
      )} />
      
      <Route path="/dashboard/enrich" component={() => (
        <DashboardLayout>
          <ProtectedRoute component={EnrichPage} />
        </DashboardLayout>
      )} />
      
      <Route path="/dashboard/contacts" component={() => (
        <DashboardLayout>
          <ProtectedRoute component={ContactsPage} />
        </DashboardLayout>
      )} />
      
      <Route path="/dashboard/companies" component={() => (
        <DashboardLayout>
          <ProtectedRoute component={CompaniesPage} />
        </DashboardLayout>
      )} />
      
      <Route path="/dashboard/ai-writer" component={() => (
        <DashboardLayout>
          <ProtectedRoute component={AiWriterPage} />
        </DashboardLayout>
      )} />
      
      <Route path="/dashboard/contact-list" component={() => (
        <DashboardLayout>
          <ProtectedRoute component={ContactListPage} />
        </DashboardLayout>
      )} />
      
      <Route path="/dashboard/crm-integrations" component={() => (
        <DashboardLayout>
          <ProtectedRoute component={CRMIntegrationsPage} />
        </DashboardLayout>
      )} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

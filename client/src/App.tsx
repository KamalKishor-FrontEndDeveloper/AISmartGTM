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
      
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <Switch>
              <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route path="/dashboard/enrich" component={() => <ProtectedRoute component={EnrichPage} />} />
              <Route path="/dashboard/contacts" component={() => <ProtectedRoute component={ContactsPage} />} />
              <Route path="/dashboard/companies" component={() => <ProtectedRoute component={CompaniesPage} />} />
              <Route path="/dashboard/ai-writer" component={() => <ProtectedRoute component={AiWriterPage} />} />
              <Route path="/dashboard/contact-list" component={() => <ProtectedRoute component={ContactListPage} />} />
              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
        )}
      </Route>
      
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

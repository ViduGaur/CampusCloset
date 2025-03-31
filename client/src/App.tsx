import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/lib/auth-context";

// Import pages
import Home from "@/pages/home";
import Register from "@/pages/register";
import Verification from "@/pages/verification";
import VerificationPending from "@/pages/verification-pending";
import AdminDashboard from "@/pages/admin-dashboard";
import ItemUpload from "@/pages/item-upload";
import Profile from "@/pages/profile";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/register" component={Register} />
      <Route path="/verification" component={Verification} />
      <Route path="/verification-pending" component={VerificationPending} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/upload" component={ItemUpload} />
      <Route path="/profile/:id" component={Profile} />
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

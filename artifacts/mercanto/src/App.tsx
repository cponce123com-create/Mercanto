import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, DistrictProvider } from "@/lib/contexts";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import StoresDirectory from "@/pages/stores/index";
import StoreDetail from "@/pages/stores/detail";
import MapPage from "@/pages/map";
import SearchPage from "@/pages/search";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import CreateStore from "@/pages/create-store";
import VendorDashboard from "@/pages/vendor/dashboard";
import VendorProducts from "@/pages/vendor/products";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminStores from "@/pages/admin/stores";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/stores" component={StoresDirectory} />
      <Route path="/stores/:slug" component={StoreDetail} />
      <Route path="/map" component={MapPage} />
      <Route path="/search" component={SearchPage} />
      
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/create-store" component={CreateStore} />
      
      <Route path="/vendor" component={VendorDashboard} />
      <Route path="/vendor/products" component={VendorProducts} />
      
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/stores" component={AdminStores} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DistrictProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </DistrictProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

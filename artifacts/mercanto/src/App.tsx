import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, DistrictProvider, useDistrict } from "@/lib/contexts";
import { BottomNav } from "@/components/layout/BottomNav";
import { DISTRICTS } from "@/lib/constants";
import { MapPin, X } from "lucide-react";
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
import VendorStoreSettings from "@/pages/vendor/store-settings";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminStores from "@/pages/admin/stores";
import AdminStoreDetail from "@/pages/admin/store-detail";
import AdminUsers from "@/pages/admin/users";
import AdminCategories from "@/pages/admin/categories";
import AdminBanners from "@/pages/admin/banners";
import AdminVerifications from "@/pages/admin/verifications";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function DistrictPickerModal() {
  const { showPicker, setShowPicker, setDistrict, district } = useDistrict();
  if (!showPicker) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#EF4444]" />
            <span className="font-bold text-sm text-[#1E293B]">¿En qué distrito estás?</span>
          </div>
          {district && (
            <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="px-5 pt-3 pb-1 text-xs text-gray-500">
          Selecciona tu distrito para ver tiendas y ofertas cercanas a ti.
        </p>
        <div className="overflow-y-auto max-h-[50vh] px-3 py-2">
          {DISTRICTS.map(d => (
            <button
              key={d}
              onClick={() => setDistrict(d)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#1E293B] hover:bg-[#EFF6FF] hover:text-[#2563EB] transition-colors flex items-center gap-2"
            >
              <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
              {d}
            </button>
          ))}
        </div>
        <div className="px-5 pb-5 pt-2 border-t mt-1">
          <p className="text-[10px] text-gray-400 text-center">
            Puedes cambiar el distrito en cualquier momento desde la barra de navegación.
          </p>
        </div>
      </div>
    </div>
  );
}

const HIDE_BOTTOM_NAV = ["/admin", "/vendor", "/map", "/login", "/register"];

function GlobalBottomNav() {
  const [location] = useLocation();
  const hide = HIDE_BOTTOM_NAV.some(p => location === p || location.startsWith(p + "/"));
  if (hide) return null;
  return <BottomNav />;
}

function Router() {
  return (
    <>
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
        <Route path="/vendor/store" component={VendorStoreSettings} />

        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/stores" component={AdminStores} />
        <Route path="/admin/stores/:id" component={AdminStoreDetail} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/banners" component={AdminBanners} />
        <Route path="/admin/verifications" component={AdminVerifications} />

        <Route component={NotFound} />
      </Switch>
      <GlobalBottomNav />
    </>
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
              <DistrictPickerModal />
            </WouterRouter>
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </DistrictProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

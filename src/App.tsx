import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GSTProvider } from "@/context/GSTContext";
import AppLayout from "@/components/AppLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import SellerPage from "@/pages/SellerPage";
import BuyerPage from "@/pages/BuyerPage";
import GraphPage from "@/pages/GraphPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GSTProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/seller" element={<SellerPage />} />
              <Route path="/buyer" element={<BuyerPage />} />
              <Route path="/graph" element={<GraphPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </GSTProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

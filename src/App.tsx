import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GSTProvider } from "@/context/GSTContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import AdminDashboard from "@/pages/AdminDashboard";
import SellerPage from "@/pages/SellerPage";
import BuyerPage from "@/pages/BuyerPage";
import GraphPage from "@/pages/GraphPage";
import LoginPage from "@/pages/LoginPage";
import ChatBot from "@/components/ChatBot";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login/admin" replace />;
  if (!allowedRoles.includes(user!.role)) return <Navigate to={`/${user!.role === 'admin' ? '' : user!.role}`} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login/:role" element={isAuthenticated ? <Navigate to={user!.role === 'admin' ? '/' : `/${user!.role}`} replace /> : <LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AppLayout><AdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/seller" element={
        <ProtectedRoute allowedRoles={['seller', 'admin']}>
          <AppLayout><SellerPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/buyer" element={
        <ProtectedRoute allowedRoles={['buyer', 'admin']}>
          <AppLayout><BuyerPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/graph" element={
        <ProtectedRoute allowedRoles={['admin', 'buyer', 'seller']}>
          <AppLayout><GraphPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={isAuthenticated ? <NotFound /> : <Navigate to="/login/admin" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <GSTProvider>
          <BrowserRouter>
            <AppRoutes />
            <ChatBot />
          </BrowserRouter>
        </GSTProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

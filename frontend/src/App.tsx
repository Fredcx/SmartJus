
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDashboard from "./pages/CaseDashboard";

import UploadDocuments from "./pages/UploadDocuments";
import Upload from "./pages/Upload";
import Jurisprudencia from "./pages/Jurisprudencia";
import Auditoria from "./pages/Auditoria";
import Historico from "./pages/Historico";
import Chat from "./pages/Chat";
import Prazos from "./pages/Prazos";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const MainLayout = ({ children }: { children: React.ReactNode }) => (
  <SidebarProvider>
    <div className="flex min-h-screen w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col">
        <AppHeader />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  </SidebarProvider>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />

          {/* New Case Flow Routes */}
          <Route path="/cases" element={<ProtectedRoute><MainLayout><Cases /></MainLayout></ProtectedRoute>} />
          <Route path="/cases/:id" element={<ProtectedRoute><MainLayout><CaseDashboard /></MainLayout></ProtectedRoute>} />
          <Route path="/cases/:id/upload" element={<ProtectedRoute><MainLayout><UploadDocuments /></MainLayout></ProtectedRoute>} />

          {/* Legacy/Other Routes */}
          <Route path="/upload" element={<ProtectedRoute><MainLayout><Upload /></MainLayout></ProtectedRoute>} />
          <Route path="/jurisprudencia" element={<ProtectedRoute><MainLayout><Jurisprudencia /></MainLayout></ProtectedRoute>} />
          <Route path="/auditoria/:caseId/:documentId" element={<ProtectedRoute><MainLayout><Auditoria /></MainLayout></ProtectedRoute>} />
          <Route path="/historico" element={<ProtectedRoute><MainLayout><Historico /></MainLayout></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><MainLayout><Chat /></MainLayout></ProtectedRoute>} />
          <Route path="/prazos" element={<ProtectedRoute><MainLayout><Prazos /></MainLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

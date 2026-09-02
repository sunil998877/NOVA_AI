import React, { useEffect } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import SiteHeader from "./components/SiteHeader";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import DashboardView from "./pages/DashboardView";
import Campaigns from "./pages/Campaigns";
import CampaignAnalytics from "./pages/CampaignAnalytics";
import MessageCrafter from "./pages/MessageCrafter";
import MessageCrafting from "./pages/MessageCrafting";
import FindInfluencers from "./pages/FindInfluencers";
import MyInfluencers from "./pages/MyInfluencers";
import EmailManagement from "./pages/EmailManagement";
import EmailTracking from "./pages/EmailTracking";
import NewsletterTracking from "./pages/NewsletterTracking";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import { useAuth } from "./lib/AuthContext";
import { applyTheme, getTheme } from "./lib/theme";

function AppShell() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function RequireAuth() {
  const { authed } = useAuth();
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return <AppShell />;
}

function App() {
  useEffect(() => {
    applyTheme(getTheme());
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard-view" element={<DashboardView />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaign-analytics" element={<CampaignAnalytics />} />
        <Route path="/message-crafter" element={<MessageCrafter />} />
        <Route path="/message-crafting" element={<MessageCrafting />} />
        <Route path="/email-management" element={<EmailManagement />} />
        <Route path="/email-tracking" element={<EmailTracking />} />
        <Route path="/newsletter-tracking" element={<NewsletterTracking />} />
        <Route path="/find-influencers" element={<FindInfluencers />} />
        <Route path="/my-influencers" element={<MyInfluencers />} />
      </Route>
    </Routes>
  );
}

export default App;

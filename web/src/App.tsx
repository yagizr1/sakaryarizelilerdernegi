import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth, homeForRole } from "@/lib/auth";
import AppLayout from "@/components/layout/AppLayout";
import MemberLayout from "@/components/layout/MemberLayout";
import LoginGatePage from "@/pages/auth/LoginGatePage";
import AdminLoginPage from "@/pages/auth/AdminLoginPage";
import MemberRegisterPage from "@/pages/auth/MemberRegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import ApplicationsPage from "@/pages/ApplicationsPage";
import MembersPage from "@/pages/MembersPage";
import MemberDetailPage from "@/pages/MemberDetailPage";
import DuesPage from "@/pages/DuesPage";
import EventsPage from "@/pages/EventsPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import FinancePage from "@/pages/FinancePage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import AdminDocumentsPage from "@/pages/AdminDocumentsPage";
import MemberDashboardPage from "@/pages/member/MemberDashboardPage";
import MemberProfilePage from "@/pages/member/MemberProfilePage";
import MemberDuesPage from "@/pages/member/MemberDuesPage";
import MemberEventsPage from "@/pages/member/MemberEventsPage";
import MemberAnnouncementsPage from "@/pages/member/MemberAnnouncementsPage";
import MemberCardPage from "@/pages/member/MemberCardPage";
import MemberNotificationsPage from "@/pages/member/MemberNotificationsPage";
import MemberSettingsPage from "@/pages/member/MemberSettingsPage";

function Loading() {
  return (
    <div className="grid min-h-[100dvh] place-items-center text-sm text-muted">Yükleniyor...</div>
  );
}

function RequireAuth({ role }: { role?: "ADMIN" | "MEMBER" }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return <Outlet />;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homeForRole(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGatePage />} />
      <Route path="/login/member" element={<Navigate to="/login" replace />} />
      <Route path="/login/member/register" element={<MemberRegisterPage />} />
      <Route path="/login/admin" element={<AdminLoginPage />} />
      <Route path="/giris" element={<Navigate to="/login" replace />} />

      <Route element={<RequireAuth role="ADMIN" />}>
        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="members/:id" element={<MemberDetailPage />} />
          <Route path="dues" element={<DuesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth role="MEMBER" />}>
        <Route path="/member" element={<MemberLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<MemberDashboardPage />} />
          <Route path="profile" element={<MemberProfilePage />} />
          <Route path="dues" element={<MemberDuesPage />} />
          <Route path="events" element={<MemberEventsPage />} />
          <Route path="announcements" element={<MemberAnnouncementsPage />} />
          <Route path="card" element={<MemberCardPage />} />
          <Route path="notifications" element={<MemberNotificationsPage />} />
          <Route path="settings" element={<MemberSettingsPage />} />
        </Route>
      </Route>

      {/* Eski yollar */}
      <Route path="/uyeler" element={<Navigate to="/admin/members" replace />} />
      <Route path="/aidatlar" element={<Navigate to="/admin/dues" replace />} />
      <Route path="/etkinlikler" element={<Navigate to="/admin/events" replace />} />
      <Route path="/duyurular" element={<Navigate to="/admin/announcements" replace />} />
      <Route path="/bildirimler" element={<Navigate to="/admin/notifications" replace />} />
      <Route path="/gelir-gider" element={<Navigate to="/admin/finance" replace />} />
      <Route path="/raporlar" element={<Navigate to="/admin/reports" replace />} />
      <Route path="/ayarlar" element={<Navigate to="/admin/settings" replace />} />

      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

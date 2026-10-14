import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlineSpeakerphone,
  HiOutlineBell,
  HiOutlineChartBar,
  HiOutlineDocumentReport,
  HiOutlineCog,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineClipboardList,
  HiOutlineDocumentText,
} from "react-icons/hi";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

type NavItem = {
  to: string;
  label: string;
  icon: typeof HiOutlineHome;
  end?: boolean;
};

const mainNav: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: HiOutlineHome, end: true },
  { to: "/admin/applications", label: "Başvurular", icon: HiOutlineClipboardList },
  { to: "/admin/members", label: "Üyeler", icon: HiOutlineUsers },
  { to: "/admin/dues", label: "Aidatlar", icon: HiOutlineCash },
];

const moreNav: NavItem[] = [
  { to: "/admin/events", label: "Etkinlikler", icon: HiOutlineCalendar },
  { to: "/admin/announcements", label: "Duyurular", icon: HiOutlineSpeakerphone },
  { to: "/admin/notifications", label: "Bildirimler", icon: HiOutlineBell },
  { to: "/admin/documents", label: "Belgeler", icon: HiOutlineDocumentText },
  { to: "/admin/finance", label: "Gelir - Gider", icon: HiOutlineChartBar },
  { to: "/admin/reports", label: "Raporlar", icon: HiOutlineDocumentReport },
  { to: "/admin/settings", label: "Ayarlar", icon: HiOutlineCog },
];

const allNav: NavItem[] = [...mainNav, ...moreNav];

function linkClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
  }`;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const title =
    allNav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))
      ?.label || "Yönetici";

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-6xl bg-bg lg:max-w-none">
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-sakarya-rizeliler-v2.png"
              alt=""
              className="h-10 w-10 rounded-xl object-cover"
            />
            <div>
              <div className="text-sm font-bold">Yönetici Paneli</div>
              <div className="text-xs text-muted">Sakarya Rizeliler</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {allNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-2 text-xs text-muted">{user?.name}</div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <HiOutlineLogout className="h-5 w-5" /> Çıkış
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <span className="font-bold">Menü</span>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-50">
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {allNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={logout}
              className="m-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-medium"
            >
              <HiOutlineLogout className="h-5 w-5" /> Çıkış yap
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <button
            className="rounded-xl p-2 hover:bg-slate-50 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Menü"
          >
            <HiOutlineMenu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </header>

        <main className="flex-1 px-4 py-4 pb-24 lg:px-6 lg:pb-6">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                    isActive ? "text-brand-600" : "text-slate-500"
                  }`
                }
              >
                <item.icon className="h-6 w-6" />
                {item.label.split(" ")[0]}
              </NavLink>
            ))}
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex flex-col items-center gap-1 py-2 text-[11px] font-medium ${
                moreOpen || moreNav.some((n) => location.pathname.startsWith(n.to))
                  ? "text-brand-600"
                  : "text-slate-500"
              }`}
            >
              <HiOutlineMenu className="h-6 w-6" />
              Daha
            </button>
          </div>
        </nav>

        {moreOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button className="absolute inset-0 bg-black/30" onClick={() => setMoreOpen(false)} />
            <div className="absolute inset-x-0 bottom-16 mx-3 rounded-2xl bg-white p-2 shadow-xl">
              {moreNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <item.icon className="h-5 w-5 text-brand-600" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

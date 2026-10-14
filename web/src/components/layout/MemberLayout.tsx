import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlineSpeakerphone,
  HiOutlineIdentification,
  HiOutlineBell,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineDotsHorizontal,
  HiOutlineX,
} from "react-icons/hi";
import { useAuth } from "@/lib/auth";

const primaryNav = [
  { to: "/member/dashboard", label: "Ana Sayfa", icon: HiOutlineHome, end: true as const },
  { to: "/member/dues", label: "Aidat", icon: HiOutlineCash, end: false as const },
  { to: "/member/events", label: "Etkinlik", icon: HiOutlineCalendar, end: false as const },
  { to: "/member/announcements", label: "Duyuru", icon: HiOutlineSpeakerphone, end: false as const },
];

const moreNav = [
  { to: "/member/profile", label: "Profil", icon: HiOutlineUser, end: false as const },
  { to: "/member/card", label: "Üyelik Kartı", icon: HiOutlineIdentification, end: false as const },
  { to: "/member/notifications", label: "Bildirimler", icon: HiOutlineBell, end: false as const },
  { to: "/member/settings", label: "Ayarlar", icon: HiOutlineCog, end: false as const },
];

const allNav = [...primaryNav, ...moreNav];

function linkClass(active: boolean, compact = false) {
  if (compact) {
    return `flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold transition ${
      active ? "text-[#2f7a3e]" : "text-slate-500"
    }`;
  }
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
    active ? "bg-[#2f7a3e]/10 text-[#1f5c2e]" : "text-slate-600 hover:bg-white/70"
  }`;
}

export default function MemberLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const title =
    allNav.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))
      ?.label || "Üye Paneli";

  const moreActive = moreNav.some((n) => location.pathname.startsWith(n.to));

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <div className="member-shell min-h-[100dvh] md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-[#e4e8ef] bg-white/90 backdrop-blur md:flex">
        <div className="border-b border-[#e4e8ef] px-4 py-5">
          <div className="flex items-center gap-3">
            <img
              src="/logo-sakarya-rizeliler-v2.png"
              alt=""
              className="h-11 w-11 rounded-2xl object-cover ring-1 ring-[#2f7a3e]/20"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-[#1a2b4b]">Üye Paneli</div>
              <div className="truncate text-xs text-[#7a8499]">Sakarya Rizeliler</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {allNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => linkClass(isActive)}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[#e4e8ef] p-3">
          <div className="mb-2 truncate px-2 text-sm font-semibold text-[#1a2b4b]">{user?.name}</div>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <HiOutlineLogout className="h-5 w-5" />
            Çıkış
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[#e4e8ef]/80 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <img
              src="/logo-sakarya-rizeliler-v2.png"
              alt=""
              className="h-9 w-9 rounded-full object-cover md:hidden"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-[#1a2b4b] md:text-lg">{title}</h1>
              <p className="truncate text-xs text-[#7a8499] md:hidden">{user?.name}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl p-2 text-[#5b6578] hover:bg-slate-50 md:hidden"
              aria-label="Çıkış"
            >
              <HiOutlineLogout className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-6 md:pb-8">
          <div className="member-page mx-auto w-full max-w-3xl animate-[slideUp_0.35s_ease-out]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e4e8ef] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => linkClass(isActive, true)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={linkClass(moreActive && !moreOpen, true)}
            aria-label="Daha fazla"
          >
            <HiOutlineDotsHorizontal className="h-5 w-5" />
            Daha
          </button>
        </div>
      </nav>

      {/* More sheet */}
      {moreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1a2b4b]/40"
            aria-label="Kapat"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 animate-[slideUp_0.25s_ease-out] rounded-t-3xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1a2b4b]">Daha fazla</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-50"
                aria-label="Kapat"
              >
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {moreNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      isActive
                        ? "border-[#2f7a3e]/30 bg-[#2f7a3e]/8 text-[#1f5c2e]"
                        : "border-[#e4e8ef] bg-slate-50 text-[#1a2b4b]"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

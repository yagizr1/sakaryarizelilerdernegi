import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatDueDate, money } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import {
  HiOutlineCash,
  HiOutlineCalendar,
  HiOutlineSpeakerphone,
  HiOutlineBadgeCheck,
  HiOutlineArrowRight,
} from "react-icons/hi";

type Dash = {
  member: { firstName: string; lastName: string; status: string; memberNo: string };
  duesSummary: { debt: number; unpaidCount: number; paidCount: number; latestStatus: string };
  upcomingEvents: Array<{ id: string; title: string; date: string; time: string; location: string }>;
  announcements: Array<{ id: string; title: string; publishDate: string }>;
};

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["member-dashboard"],
    queryFn: () => api<Dash>("/member/dashboard"),
  });

  if (isLoading || !data) return <p className="text-sm member-muted">Yükleniyor...</p>;

  const name = `${data.member.firstName} ${data.member.lastName}`.trim() || user?.name || "";
  const isActive = data.member.status === "aktif";
  const duesOk = !(data.duesSummary.debt > 0);

  const stats = [
    {
      label: "Üyelik",
      value: isActive ? "Aktif" : data.member.status,
      hint: data.member.memberNo || "—",
      to: "/member/profile",
      icon: HiOutlineBadgeCheck,
      tone: isActive ? "text-[#2f7a3e]" : "text-[#1a2b4b]",
    },
    {
      label: "Aidat",
      value: duesOk ? "Güncel" : money(data.duesSummary.debt),
      hint: duesOk ? "Borç yok" : `${data.duesSummary.unpaidCount} açık kayıt`,
      to: "/member/dues",
      icon: HiOutlineCash,
      tone: duesOk ? "text-[#2f7a3e]" : "text-amber-700",
    },
    {
      label: "Etkinlik",
      value: String(data.upcomingEvents.length),
      hint: "Yaklaşan",
      to: "/member/events",
      icon: HiOutlineCalendar,
      tone: "text-[#1a2b4b]",
    },
    {
      label: "Duyuru",
      value: String(data.announcements.length),
      hint: "Son duyurular",
      to: "/member/announcements",
      icon: HiOutlineSpeakerphone,
      tone: "text-[#1a2b4b]",
    },
  ];

  return (
    <div className="space-y-5">
      <section className="member-hero">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#2f7a3e]">Üye paneli</p>
        <h2 className="mt-1 text-xl font-bold text-[#1a2b4b] sm:text-2xl">Hoş geldiniz, {name}</h2>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-[#1f5c2e] ring-1 ring-[#2f7a3e]/15">
          <span className={`h-2 w-2 rounded-full ${isActive ? "bg-[#2f7a3e]" : "bg-slate-400"}`} />
          {isActive ? "Aktif üye" : statusLabelSafe(data.member.status)}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="member-stat group block transition hover:border-[#2f7a3e]/25">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium member-muted">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.tone} opacity-80`} />
            </div>
            <div className={`mt-2 text-lg font-bold ${s.tone}`}>{s.value}</div>
            <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#2f7a3e]">
              {s.hint}
              <HiOutlineArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
            </div>
          </Link>
        ))}
      </div>

      <section className="member-card">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="member-section-title">Yaklaşan etkinlikler</h3>
          <Link to="/member/events" className="text-xs font-semibold text-[#2f7a3e]">
            Tümü
          </Link>
        </div>
        {data.upcomingEvents.length === 0 ? (
          <p className="text-sm member-muted">Yaklaşan etkinlik yok</p>
        ) : (
          <ul className="space-y-2">
            {data.upcomingEvents.slice(0, 3).map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-[#eef1f5] bg-[#f8fafb] px-3 py-2.5"
              >
                <div className="text-sm font-semibold text-[#1a2b4b]">{e.title}</div>
                <div className="mt-0.5 text-xs member-muted">
                  {e.date ? formatDueDate(e.date) : ""}
                  {e.time ? ` · ${e.time}` : ""}
                  {e.location ? ` · ${e.location}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function statusLabelSafe(status: string) {
  if (status === "pasif") return "Pasif üye";
  return status || "Üye";
}

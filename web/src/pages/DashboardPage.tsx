import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatDueDate, money, initials, statusLabel } from "@/lib/format";
import { Badge, Card, Empty, PageHeader, Stat, statusTone } from "@/components/ui";

type Dash = {
  stats: {
    toplamUye: number;
    aktifUye: number;
    beklemede: number;
    pasifUye: number;
    buAyAidat: number;
    yaklasanEtkinlik: number;
  };
  recentMembers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    profession: string;
    status: string;
  }>;
  upcomingEvents: Array<{ id: string; title: string; date: string; time: string; location: string }>;
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Dash>("/dashboard"),
  });

  if (isLoading || !data) return <p className="text-sm text-muted">Yükleniyor...</p>;

  const { stats, recentMembers, upcomingEvents } = data;

  return (
    <div>
      <PageHeader title="Dashboard" desc="Dernek özeti" />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Toplam Üye" value={stats.toplamUye} tone="blue" />
        <Stat label="Aktif Üye" value={stats.aktifUye} tone="green" />
        <Stat label="Bekleyen Başvuru" value={stats.beklemede} tone="orange" />
        <Stat label="Pasif Üye" value={stats.pasifUye} tone="red" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-2">
        <Stat label="Tahsilat (ödendi)" value={money(stats.buAyAidat)} tone="green" />
        <Stat label="Yaklaşan Etkinlik" value={stats.yaklasanEtkinlik} tone="blue" />
      </div>

      {stats.beklemede > 0 ? (
        <Card className="mb-4 flex items-center justify-between gap-3 bg-amber-50 !border-amber-100">
          <div>
            <div className="font-bold text-amber-900">{stats.beklemede} bekleyen üye başvurusu</div>
            <div className="text-sm text-amber-800">Onay için başvurular sayfasını kontrol edin</div>
          </div>
          <Link
            to="/admin/applications"
            className="shrink-0 rounded-xl bg-amber-600 px-3 py-2 text-sm font-semibold text-white"
          >
            İncele
          </Link>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Son Üyeler</h3>
            <Link to="/admin/members" className="text-sm font-semibold text-brand-600">
              Tümü
            </Link>
          </div>
          {recentMembers.length === 0 ? (
            <Empty text="Henüz üye yok" />
          ) : (
            <div className="space-y-2">
              {recentMembers.map((m) => (
                <Link
                  key={m.id}
                  to={`/admin/members/${m.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {initials(m.firstName, m.lastName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {m.firstName} {m.lastName}
                    </div>
                    <div className="text-xs text-muted">{m.profession || m.phone || "—"}</div>
                  </div>
                  <Badge tone={statusTone(m.status)}>{statusLabel[m.status] || m.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold">Yaklaşan Etkinlikler</h3>
            <Link to="/admin/events" className="text-sm font-semibold text-brand-600">
              Tümü
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <Empty text="Yaklaşan etkinlik yok" />
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="font-semibold">{e.title}</div>
                  <div className="mt-1 text-xs text-muted">
                    {e.date ? formatDueDate(e.date) : ""} {e.time && `· ${e.time}`}{" "}
                    {e.location && `· ${e.location}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

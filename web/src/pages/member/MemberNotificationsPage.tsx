import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Empty } from "@/components/ui";

type Log = {
  id: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  createdAt: string;
};

export default function MemberNotificationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["member-notifications"],
    queryFn: () => api<Log[]>("/member/notifications"),
  });

  if (isLoading || !data) return <p className="text-sm member-muted">Yükleniyor...</p>;
  if (data.length === 0) return <Empty text="Bildirim yok" />;

  return (
    <div className="space-y-2">
      {data.map((n) => (
        <article key={n.id} className="member-card !py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 text-sm font-semibold text-[#1a2b4b]">
              {n.subject || "Bildirim"}
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
              {n.channel}
            </span>
          </div>
          {n.body ? <p className="mt-1 line-clamp-3 text-sm text-slate-600">{n.body}</p> : null}
          <div className="mt-2 text-[11px] member-muted">
            {new Date(n.createdAt).toLocaleString("tr-TR")}
          </div>
        </article>
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDueDate } from "@/lib/format";
import { Empty } from "@/components/ui";

type Ann = { id: string; title: string; description: string; publishDate: string };

export default function MemberAnnouncementsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["member-announcements"],
    queryFn: () => api<Ann[]>("/member/announcements"),
  });

  if (isLoading || !data) return <p className="text-sm member-muted">Yükleniyor...</p>;
  if (data.length === 0) return <Empty text="Henüz duyuru yok" />;

  return (
    <div className="space-y-3">
      {data.map((a) => (
        <article key={a.id} className="member-card">
          <h3 className="font-bold text-[#1a2b4b]">{a.title}</h3>
          {a.publishDate ? (
            <div className="mt-1 text-xs member-muted">{formatDueDate(a.publishDate)}</div>
          ) : null}
          {a.description ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {a.description}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

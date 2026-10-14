import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDueDate, statusLabel } from "@/lib/format";
import { Badge, Button, statusTone } from "@/components/ui";
import { useToast } from "@/lib/toast";

type EventRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
  attending: boolean;
};

export default function MemberEventsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["member-events"],
    queryFn: () => api<EventRow[]>("/member/events"),
  });

  const attend = useMutation({
    mutationFn: (id: string) => api(`/member/events/${id}/attend`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member-events"] });
      toast.success("Katılımınız kaydedildi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-sm member-muted">Yükleniyor...</p>;

  const upcoming = data.filter((e) => e.status === "yaklasan");
  const past = data.filter((e) => e.status !== "yaklasan");

  function list(title: string, items: EventRow[]) {
    return (
      <section>
        <h3 className="member-section-title mb-2">{title}</h3>
        {items.length === 0 ? (
          <div className="member-card mb-5 text-sm member-muted">Kayıt yok</div>
        ) : (
          <div className="mb-5 space-y-3">
            {items.map((e) => (
              <article key={e.id} className="member-card space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1a2b4b]">{e.title}</div>
                    <div className="mt-1 text-xs member-muted">
                      {e.date ? formatDueDate(e.date) : ""}
                      {e.time ? ` · ${e.time}` : ""}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                  </div>
                  <Badge tone={statusTone(e.status)}>{statusLabel[e.status] || e.status}</Badge>
                </div>
                {e.description ? (
                  <p className="text-sm leading-relaxed text-slate-600">{e.description}</p>
                ) : null}
                {e.status === "yaklasan" ? (
                  e.attending ? (
                    <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Katılacaksınız
                    </p>
                  ) : (
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={attend.isPending}
                      onClick={() => attend.mutate(e.id)}
                    >
                      Katılacağım
                    </Button>
                  )
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <div>
      {list("Yaklaşan", upcoming)}
      {list("Geçmiş", past)}
    </div>
  );
}

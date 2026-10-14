import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { dueMonthKey, effectiveDueStatus, formatDueMonth, money, statusLabel } from "@/lib/format";
import { Badge, statusTone } from "@/components/ui";

type Due = { id: string; amount: number; dueDate: string; status: string; note: string };

export default function MemberDuesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["member-dues"],
    queryFn: () => api<{ debt: number; dues: Due[] }>("/member/dues"),
  });

  const byYear = useMemo(() => {
    const map = new Map<string, Due[]>();
    for (const d of data?.dues || []) {
      const key = dueMonthKey(d.dueDate).slice(0, 4) || "Diğer";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [data]);

  if (isLoading || !data) return <p className="text-sm member-muted">Yükleniyor...</p>;

  const hasDebt = data.debt > 0;

  return (
    <div className="space-y-5">
      <div className="member-card">
        <div className="text-xs font-medium member-muted">Toplam borç</div>
        <div className={`mt-1 text-2xl font-bold sm:text-3xl ${hasDebt ? "text-amber-700" : "text-[#2f7a3e]"}`}>
          {money(data.debt)}
        </div>
        <p className="mt-1 text-xs member-muted">
          {hasDebt ? "Ödenmemiş aidatlarınız bulunmaktadır." : "Aidat durumunuz güncel."}
        </p>
      </div>

      {byYear.length === 0 ? (
        <div className="member-card text-sm member-muted">Aidat kaydı yok</div>
      ) : (
        byYear.map(([year, dues]) => (
          <section key={year}>
            <h3 className="member-section-title mb-2">{year}</h3>
            <div className="space-y-2">
              {dues
                .slice()
                .sort((a, b) => dueMonthKey(b.dueDate).localeCompare(dueMonthKey(a.dueDate)))
                .map((d) => {
                  const st = effectiveDueStatus(d.status, d.dueDate);
                  return (
                    <div
                      key={d.id}
                      className="member-card flex items-center justify-between gap-3 !py-3"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#1a2b4b]">{formatDueMonth(d.dueDate)}</div>
                        <div className="text-xs member-muted">{money(d.amount)}</div>
                      </div>
                      <Badge tone={statusTone(st)}>{statusLabel[st] || st}</Badge>
                    </div>
                  );
                })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

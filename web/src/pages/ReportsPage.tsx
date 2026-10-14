import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { Card, Empty, PageHeader, Select, Stat } from "@/components/ui";

type Period = {
  key: string;
  label: string;
  newMembers: number;
  payingMembers: number;
  paidAmount: number;
};

type Reports = {
  currentMonth: Period;
  currentYear: Period;
  monthly: Period[];
  yearly: Period[];
};

type Mode = "monthly" | "yearly";

function currentYearKey() {
  return String(new Date().getFullYear());
}

function currentMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsPage() {
  const [mode, setMode] = useState<Mode>("monthly");
  const [yearFilter, setYearFilter] = useState(currentYearKey);
  const [monthFilter, setMonthFilter] = useState(currentMonthKey);

  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => api<Reports>("/reports"),
  });

  const yearOptions = useMemo(() => {
    if (!data) return [currentYearKey()];
    const set = new Set<string>([currentYearKey()]);
    for (const y of data.yearly) set.add(y.key);
    for (const m of data.monthly) set.add(m.key.slice(0, 4));
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [data]);

  const monthOptions = useMemo(() => {
    if (!data) return [];
    return data.monthly
      .filter((m) => m.key.startsWith(`${yearFilter}-`))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [data, yearFilter]);

  const rows = useMemo(() => {
    if (!data) return [];
    if (mode === "yearly") {
      return [...data.yearly].sort((a, b) => a.key.localeCompare(b.key));
    }
    // Seçili yıl: Ocak → Aralık
    return data.monthly
      .filter((m) => m.key.startsWith(`${yearFilter}-`))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [data, mode, yearFilter]);

  const focus = useMemo(() => {
    if (!data) return null;
    if (mode === "yearly") {
      return data.yearly.find((y) => y.key === yearFilter) || data.currentYear;
    }
    if (monthFilter === "all") {
      return data.yearly.find((y) => y.key === yearFilter) || data.currentYear;
    }
    return data.monthly.find((m) => m.key === monthFilter) || data.currentMonth;
  }, [data, mode, yearFilter, monthFilter]);

  if (isLoading || !data || !focus) {
    return <p className="text-sm text-muted">Yükleniyor...</p>;
  }

  const focusLabel =
    mode === "yearly"
      ? yearFilter
      : monthFilter === "all"
        ? `${yearFilter} (tüm aylar)`
        : focus.label;

  return (
    <div>
      <PageHeader
        title="Raporlar"
        desc={`Dönem: ${focusLabel}`}
        action={
          <div className="inline-flex rounded-xl border border-border bg-white p-1">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "monthly" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setMode("monthly")}
            >
              Aylık
            </button>
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "yearly" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() => setMode("yearly")}
            >
              Yıllık
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="sm:w-40">
          <Select
            label="Yıl"
            value={yearFilter}
            onChange={(e) => {
              const y = e.target.value;
              setYearFilter(y);
              const cur = currentMonthKey();
              if (cur.startsWith(`${y}-`)) setMonthFilter(cur);
              else setMonthFilter(`${y}-01`);
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        {mode === "monthly" ? (
          <div className="sm:w-56">
            <Select label="Ay" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
              <option value="all">Tüm aylar</option>
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Yeni üye" value={focus.newMembers} tone="blue" />
        <Stat label="Aidat ödeyen üye" value={focus.payingMembers} tone="green" />
        <Stat label="Tahsilat" value={money(focus.paidAmount)} tone="orange" />
      </div>

      <Card>
        <h3 className="mb-3 font-bold">
          {mode === "monthly" ? `${yearFilter} — Aylar (Ocak → Aralık)` : "Yıllar"}
        </h3>
        {rows.length === 0 ? (
          <Empty text="Veri yok" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="pb-2 pr-3 font-semibold">Dönem</th>
                  <th className="pb-2 pr-3 font-semibold">Yeni üye</th>
                  <th className="pb-2 pr-3 font-semibold">Aidat ödeyen</th>
                  <th className="pb-2 font-semibold">Tahsilat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.key}
                    className={`border-b border-border/70 last:border-0 ${
                      mode === "monthly" && monthFilter === r.key ? "bg-brand-50/70" : ""
                    }`}
                  >
                    <td className="py-3 pr-3 font-medium">{r.label}</td>
                    <td className="py-3 pr-3">{r.newMembers}</td>
                    <td className="py-3 pr-3">{r.payingMembers}</td>
                    <td className="py-3 font-semibold text-green-700">{money(r.paidAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

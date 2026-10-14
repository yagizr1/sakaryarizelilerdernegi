import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import {
  dueMonthKey,
  effectiveDueStatus,
  formatDueDate,
  formatDueMonth,
  money,
  monthEndISO,
  statusLabel,
} from "@/lib/format";
import { useToast } from "@/lib/toast";
import { useSelectionMode } from "@/hooks/useSelectionMode";
import { Badge, Button, Card, Empty, Input, PageHeader, Select, Stat } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import SelectionBar from "@/components/SelectionBar";
import { HiOutlineCheck, HiOutlinePlus, HiOutlineSearch, HiOutlineMail, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";

type Due = {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
  receipt: string;
  memberName: string;
  memberId: string;
};

type Member = { id: string; firstName: string; lastName: string; phone?: string; nationalId?: string };

function currentMonthKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

const emptyForm = {
  memberId: "",
  amount: "",
  dueDate: monthEndISO(),
  paidNow: false,
};

export default function DuesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [memberQ, setMemberQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleteOne, setDeleteOne] = useState<Due | null>(null);
  const [monthFilter, setMonthFilter] = useState(currentMonthKey);
  const selection = useSelectionMode();

  const { data = [], isLoading } = useQuery({
    queryKey: ["dues"],
    queryFn: () => api<Due[]>("/dues"),
  });
  const { data: members = [] } = useQuery({
    queryKey: ["members-all"],
    queryFn: () => api<Member[]>("/members"),
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<{ monthlyDueAmount?: number; monthlyDueFixed?: boolean }>("/settings"),
  });
  const monthlyFixed = Boolean(settings?.monthlyDueFixed);
  const monthlyAmount = Number(settings?.monthlyDueAmount) || 0;

  const filteredMembers = useMemo(() => {
    const q = memberQ.trim().toLocaleLowerCase("tr-TR");
    if (!q) return members.slice(0, 8);
    return members
      .filter((m) => {
        const hay = `${m.firstName} ${m.lastName} ${m.phone || ""} ${m.nationalId || ""}`.toLocaleLowerCase("tr-TR");
        return hay.includes(q);
      })
      .slice(0, 12);
  }, [members, memberQ]);

  const selectedMember = members.find((m) => m.id === form.memberId);

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ["dues"] });
    qc.invalidateQueries({ queryKey: ["finance"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["members"] });
  }

  const create = useMutation({
    mutationFn: () =>
      api("/dues", {
        method: "POST",
        body: JSON.stringify({
          memberId: form.memberId,
          amount: Number(form.amount),
          dueDate: form.dueDate,
          status: form.paidNow ? "odendi" : "bekliyor",
        }),
      }),
    onSuccess: () => {
      invalidateAll();
      closeForm();
      toast.success("Aidat kaydı eklendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Aidat eklenemedi"),
  });

  const update = useMutation({
    mutationFn: () =>
      api(`/dues/${editId}`, {
        method: "PUT",
        body: JSON.stringify({
          memberId: form.memberId,
          amount: Number(form.amount),
          dueDate: form.dueDate,
          status: form.paidNow ? "odendi" : "bekliyor",
        }),
      }),
    onSuccess: () => {
      invalidateAll();
      closeForm();
      toast.success("Aidat güncellendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Güncellenemedi"),
  });

  const markPaid = useMutation({
    mutationFn: (id: string) =>
      api(`/dues/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "odendi" }),
      }),
    onSuccess: () => {
      invalidateAll();
      toast.success("Aidat ödendi olarak işaretlendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Güncellenemedi"),
  });

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api(`/dues/${id}`, { method: "DELETE" })));
    },
    onSuccess: (_d, ids) => {
      invalidateAll();
      setConfirmDel(false);
      setDeleteOne(null);
      setExpandedId(null);
      selection.exit();
      toast.success(`${ids.length} aidat silindi`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Silinemedi"),
  });

  const remind = useMutation({
    mutationFn: (dueIds: string[]) =>
      api<{ sent: number; failed: number }>("/notifications/dues-reminder", {
        method: "POST",
        body: JSON.stringify({ dueIds, channel: "both" }),
      }),
    onSuccess: (res) => {
      toast.success(`Hatırlatma: ${res.sent} gönderildi${res.failed ? `, ${res.failed} hata` : ""}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gönderilemedi"),
  });

  const generateMonth = useMutation({
    mutationFn: () =>
      api<{ created: number; skipped: number; message: string; amount: number }>("/dues/generate-month", {
        method: "POST",
        body: "{}",
      }),
    onSuccess: (res) => {
      invalidateAll();
      toast.success(res.message || `${res.created} aidat oluşturuldu`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Oluşturulamadı"),
  });

  const withEffective = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        displayStatus: effectiveDueStatus(d.status, d.dueDate),
        monthLabel: formatDueMonth(d.dueDate),
        monthKey: dueMonthKey(d.dueDate),
      })),
    [data]
  );

  const monthOptions = useMemo(() => {
    const keys = new Set<string>([currentMonthKey()]);
    for (const d of withEffective) keys.add(d.monthKey);
    return [...keys]
      .filter((k) => k !== "0000-00")
      .sort((a, b) => b.localeCompare(a))
      .map((key) => ({
        key,
        label: formatDueMonth(`${key}-01`),
      }));
  }, [withEffective]);

  const filtered = useMemo(() => {
    if (monthFilter === "all") return withEffective;
    return withEffective.filter((d) => d.monthKey === monthFilter);
  }, [withEffective, monthFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; items: typeof filtered }>();
    for (const d of filtered) {
      const existing = map.get(d.monthKey);
      if (existing) existing.items.push(d);
      else map.set(d.monthKey, { label: d.monthLabel, items: [d] });
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, g]) => g);
  }, [filtered]);

  const payerCount = new Set(filtered.filter((d) => d.displayStatus === "odendi").map((d) => d.memberId)).size;
  const waitingCount = new Set(filtered.filter((d) => d.displayStatus === "bekliyor").map((d) => d.memberId)).size;
  const overdueCount = new Set(filtered.filter((d) => d.displayStatus === "odenmedi").map((d) => d.memberId)).size;

  const selectedMonthLabel =
    monthFilter === "all" ? "Tüm aylar" : formatDueMonth(`${monthFilter}-01`);

  function closeForm() {
    setOpen(false);
    setEditId(null);
    setForm({ ...emptyForm, dueDate: monthEndISO() });
    setMemberQ("");
  }

  function openCreate() {
    setEditId(null);
    setForm({
      ...emptyForm,
      dueDate: monthEndISO(),
      amount: monthlyFixed && monthlyAmount > 0 ? String(monthlyAmount) : "",
    });
    setMemberQ("");
    setOpen(true);
  }

  function openEdit(d: Due) {
    setEditId(d.id);
    setForm({
      memberId: d.memberId,
      amount: d.amount > 0 ? String(d.amount) : "",
      dueDate: d.dueDate || monthEndISO(),
      paidNow: d.status === "odendi",
    });
    setMemberQ("");
    setExpandedId(null);
    setOpen(true);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.memberId) {
      toast.error("Üye seçin");
      return;
    }
    if (!(Number(form.amount) > 0)) {
      toast.error("Tutar girin");
      return;
    }
    if (editId) update.mutate();
    else create.mutate();
  }

  const saving = create.isPending || update.isPending;

  return (
    <div className={selection.selecting ? "pb-20" : ""}>
      <PageHeader
        title="Aidatlar"
        desc={
          selection.selecting
            ? "Seçim modu"
            : `${selectedMonthLabel}: ay içinde bekler · ay bitince ödenmedi sayılır`
        }
        action={
          !selection.selecting ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={generateMonth.isPending}
                onClick={() => {
                  if (monthlyFixed && !monthlyAmount) {
                    toast.error("Ayarlar'dan aylık aidat tutarını girin");
                    return;
                  }
                  generateMonth.mutate();
                }}
              >
                {generateMonth.isPending ? "Oluşturuluyor..." : "Bu ay aidatlarını oluştur"}
              </Button>
              <Button onClick={openCreate}>
                <HiOutlinePlus className="h-5 w-5" /> Aidat Ekle
              </Button>
            </div>
          ) : undefined
        }
      />
      {monthlyFixed ? (
        monthlyAmount > 0 ? (
          <p className="mb-3 text-sm text-muted">
            Sabit aylık aidat: <span className="font-semibold text-brand-700">{money(monthlyAmount)}</span>
          </p>
        ) : (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Sabit aidat açık ama tutar girilmemiş. Ayarlar’dan tutarı kaydedin.
          </p>
        )
      ) : (
        <p className="mb-3 text-sm text-muted">
          Sabit aylık aidat kapalı — ay kaydı oluşturulur, tutar kim ne yatırdıysa sonradan girilir.
        </p>
      )}

      <div className="mb-4 sm:w-56">
        <Select
          label="Ay"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
        >
          <option value="all">Tüm aylar</option>
          {monthOptions.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ödeyen" value={`${payerCount} kişi`} tone="green" />
        <Stat label="Bekleyen" value={`${waitingCount} kişi`} tone="orange" />
        <Stat label="Ödemeyen" value={`${overdueCount} kişi`} tone="red" />
        <Stat label="Kayıt" value={filtered.length} tone="blue" />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : grouped.length === 0 ? (
        <Empty text={monthFilter === "all" ? "Aidat kaydı yok" : `${selectedMonthLabel} için kayıt yok`} />
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <section key={group.label}>
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-sm font-bold text-brand-700">{group.label} Aidatı</h3>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  {group.items.length} kayıt
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((d) => {
                  const expanded = expandedId === d.id && !selection.selecting;
                  const on = selection.isSelected(d.id);
                  return (
                    <div key={d.id} {...selection.bindItem(d.id)}>
                      <Card
                        className={`!p-3 transition select-none ${
                          on ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-200" : expanded ? "border-brand-200" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() => {
                              if (selection.handleClick(d.id)) return;
                              setExpandedId(expanded ? null : d.id);
                            }}
                          >
                            <div className="truncate text-sm font-semibold">{d.memberName}</div>
                            <div className="hidden text-xs text-muted sm:block">
                              {d.amount > 0 ? money(d.amount) : "Tutar girilmedi"} · Son ödeme{" "}
                              {formatDueDate(d.dueDate)}
                            </div>
                          </button>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {selection.selecting ? (
                              <span
                                className={`grid h-7 w-7 place-items-center rounded-full ${
                                  on ? "bg-brand-600 text-white" : "border border-border bg-white text-transparent"
                                }`}
                              >
                                <HiOutlineCheck className="h-4 w-4" />
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(expanded ? null : d.id)}
                                  className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    d.displayStatus === "odendi"
                                      ? "bg-green-50 text-green-700"
                                      : d.displayStatus === "odenmedi"
                                        ? "bg-red-50 text-red-700"
                                        : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {statusLabel[d.displayStatus]}
                                </button>
                                <Badge tone="primary" className="hidden sm:inline-flex">
                                  {d.monthLabel}
                                </Badge>
                                {d.status !== "odendi" && (
                                  <>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="!min-h-8 !gap-1 !px-2 !text-[11px]"
                                      disabled={remind.isPending}
                                      onClick={() => remind.mutate([d.id])}
                                    >
                                      <HiOutlineMail className="h-3.5 w-3.5" />
                                      Hatırlat
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      className="!min-h-8 !gap-1 !px-2 !text-[11px]"
                                      disabled={markPaid.isPending}
                                      onClick={() => {
                                        if (!(d.amount > 0)) {
                                          toast.error("Önce tutarı girin (Düzenle)");
                                          openEdit(d);
                                          return;
                                        }
                                        markPaid.mutate(d.id);
                                      }}
                                    >
                                      <HiOutlineCheck className="h-3.5 w-3.5" />
                                      Alındı
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-3 space-y-3 border-t border-border pt-3">
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                              <div className="rounded-xl bg-slate-50 p-2.5">
                                <div className="text-[11px] text-muted">Tutar</div>
                                <div className="text-sm font-semibold">
                                  {d.amount > 0 ? money(d.amount) : "Henüz girilmedi"}
                                </div>
                              </div>
                              <div className="rounded-xl bg-slate-50 p-2.5">
                                <div className="text-[11px] text-muted">Aidat ayı</div>
                                <div className="text-sm font-semibold">{d.monthLabel}</div>
                              </div>
                              <div className="col-span-2 rounded-xl bg-slate-50 p-2.5 sm:col-span-1">
                                <div className="text-[11px] text-muted">Son ödeme</div>
                                <div className="text-sm font-semibold">{formatDueDate(d.dueDate)}</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="flex-1 sm:flex-none"
                                onClick={() => openEdit(d)}
                              >
                                <HiOutlinePencil className="h-4 w-4" /> Düzenle
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                className="flex-1 sm:flex-none"
                                onClick={() => setDeleteOne(d)}
                              >
                                <HiOutlineTrash className="h-4 w-4" /> Sil
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <Card className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-b-none !p-5 sm:rounded-2xl">
            <h3 className="mb-4 text-lg font-bold">{editId ? "Aidat Düzenle" : "Aidat Kaydı"}</h3>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Üye</span>
                {selectedMember ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {selectedMember.firstName} {selectedMember.lastName}
                      </div>
                      {selectedMember.phone && (
                        <div className="text-xs text-muted">{selectedMember.phone}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold text-brand-700"
                      onClick={() => {
                        setForm((f) => ({ ...f, memberId: "" }));
                        setMemberQ("");
                      }}
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        value={memberQ}
                        onChange={(e) => setMemberQ(e.target.value)}
                        placeholder="Üye ara (ad, TC, telefon)..."
                        className="min-h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
                      {filteredMembers.length === 0 ? (
                        <p className="p-3 text-sm text-muted">Üye bulunamadı</p>
                      ) : (
                        filteredMembers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            className="flex w-full flex-col items-start border-b border-border px-3 py-2.5 text-left last:border-0 hover:bg-slate-50"
                            onClick={() => {
                              setForm((f) => ({ ...f, memberId: m.id }));
                              setMemberQ("");
                            }}
                          >
                            <span className="text-sm font-semibold">
                              {m.firstName} {m.lastName}
                            </span>
                            <span className="text-xs text-muted">
                              {[m.phone, m.nationalId].filter(Boolean).join(" · ") || "—"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              <Input
                label={monthlyFixed ? "Tutar (sabit)" : "Tutar"}
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                disabled={monthlyFixed}
                className={monthlyFixed ? "opacity-80" : ""}
              />
              {monthlyFixed ? (
                <p className="text-xs text-muted">Sabit aylık aidat açık — tutar Ayarlar’dan gelir.</p>
              ) : null}
              <Input
                label="Son Ödeme"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
              {form.dueDate && (
                <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-700">
                  Aidat ayı: {formatDueMonth(form.dueDate)}
                </p>
              )}
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border bg-slate-50 px-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#1976d2]"
                  checked={form.paidNow}
                  onChange={(e) => setForm({ ...form, paidNow: e.target.checked })}
                />
                <span className="text-sm font-medium">Aidat alındı (ödendi)</span>
              </label>
              <p className="text-xs text-muted">
                İşaretlenmezse bu ay <strong>Bekleniyor</strong>, ay geçince otomatik{" "}
                <strong>Ödenmedi</strong> görünür.
              </p>

              <div className="flex gap-2 pt-1">
                <Button type="button" variant="ghost" className="flex-1" onClick={closeForm}>
                  İptal
                </Button>
                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? "Kaydediliyor..." : editId ? "Güncelle" : "Kaydet"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <SelectionBar
        count={selection.count}
        onCancel={selection.exit}
        onDelete={() => setConfirmDel(true)}
        deleting={removeMany.isPending}
      />

      <ConfirmDialog
        open={confirmDel}
        title={`${selection.count} aidat silinsin mi?`}
        message="Seçili aidat kayıtları kalıcı olarak silinir."
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={removeMany.isPending}
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => removeMany.mutate(selection.ids)}
      />

      <ConfirmDialog
        open={!!deleteOne}
        title="Aidat silinsin mi?"
        message={
          deleteOne
            ? `${deleteOne.memberName} — ${money(deleteOne.amount)} (${formatDueMonth(deleteOne.dueDate)}) kaydı kalıcı olarak silinecek.`
            : ""
        }
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={removeMany.isPending}
        onCancel={() => setDeleteOne(null)}
        onConfirm={() => {
          if (deleteOne) removeMany.mutate([deleteOne.id]);
        }}
      />
    </div>
  );
}

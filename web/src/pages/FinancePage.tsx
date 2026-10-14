import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { formatDueDate, money, todayISO } from "@/lib/format";
import { useToast } from "@/lib/toast";
import { Badge, Button, Card, Empty, Input, PageHeader, Select, Stat } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";

type Finance = {
  toplamGelir: number;
  toplamGider: number;
  kasa: number;
  entries: Array<{
    id: string;
    date: string;
    description: string;
    category: string;
    type: string;
    amount: number;
    dueId?: string | null;
  }>;
};

export default function FinancePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "gelir",
    category: "",
    date: todayISO(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["finance"],
    queryFn: () => api<Finance>("/finance"),
  });

  const create = useMutation({
    mutationFn: () =>
      api("/finance", {
        method: "POST",
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      setForm({ description: "", amount: "", type: "gelir", category: "", date: todayISO() });
      toast.success("Kayıt eklendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Kayıt eklenemedi"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/finance/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      setDeleteId(null);
      toast.success("Kayıt silindi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Silinemedi"),
  });

  const pending = data?.entries.find((e) => e.id === deleteId);

  return (
    <div>
      <PageHeader
        title="Gelir - Gider"
        action={
          <Button onClick={() => setOpen(true)}>
            <HiOutlinePlus className="h-5 w-5" /> İşlem
          </Button>
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Gelir" value={money(data?.toplamGelir || 0)} tone="green" />
        <Stat label="Gider" value={money(data?.toplamGider || 0)} tone="red" />
        <Stat label="Kasa" value={money(data?.kasa || 0)} tone="blue" />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : !data?.entries.length ? (
        <Empty text="İşlem yok" />
      ) : (
        <div className="space-y-2">
          {data.entries.map((e) => (
            <Card key={e.id} className="!p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{e.description}</div>
                  <div className="text-xs text-muted">
                    {e.date ? formatDueDate(e.date) : "—"} · {e.category || "Genel"}
                    {e.dueId ? " · Aidattan" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className={`font-bold ${e.type === "gelir" ? "text-green-700" : "text-red-600"}`}>
                      {e.type === "gelir" ? "+" : "−"}
                      {money(e.amount)}
                    </div>
                    <Badge tone={e.type === "gelir" ? "success" : "danger"}>
                      {e.type === "gelir" ? "Gelir" : "Gider"}
                    </Badge>
                  </div>
                  {!e.dueId && (
                    <button
                      type="button"
                      className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                      title="Sil"
                      onClick={() => setDeleteId(e.id)}
                    >
                      <HiOutlineTrash className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Kayıt silinsin mi?"
        message={
          pending
            ? `"${pending.description}" (${money(pending.amount)}) kalıcı olarak silinecek.`
            : "Bu kayıt silinecek."
        }
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={remove.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove.mutate(deleteId)}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <Card className="w-full max-w-lg rounded-b-none !p-5 sm:rounded-2xl">
            <h3 className="mb-4 text-lg font-bold">Yeni İşlem</h3>
            <form
              className="space-y-3"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                create.mutate();
              }}
            >
              <Select label="Tür" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="gelir">Gelir</option>
                <option value="gider">Gider</option>
              </Select>
              <Input
                label="Açıklama"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
              <Input
                label="Tutar"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
              <Input
                label="Kategori"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <Input
                label="Tarih"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <div className="flex gap-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" className="flex-1">
                  Kaydet
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

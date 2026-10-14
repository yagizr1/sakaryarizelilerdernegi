import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineSearch } from "react-icons/hi";
import { api } from "@/lib/api";
import { formatDueDate, statusLabel } from "@/lib/format";
import { Badge, Button, Card, Empty, Input, PageHeader, statusTone } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/lib/toast";

type AppRow = {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email: string;
  birthDate: string;
  address: string;
  profession: string;
  status: string;
  rejectReason: string;
  appliedAt: string;
};

export default function ApplicationsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState("beklemede");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; nationalId: string } | null>(
    null
  );

  const { data, isLoading } = useQuery({
    queryKey: ["applications", filter, q],
    queryFn: () =>
      api<AppRow[]>(
        `/applications?status=${encodeURIComponent(filter)}&q=${encodeURIComponent(q)}`
      ),
  });

  const approve = useMutation({
    mutationFn: (id: string) => api(`/applications/${id}/approve`, { method: "POST", body: "{}" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Başvuru onaylandı");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api(`/applications/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      setRejectId(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Başvuru reddedildi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["applications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Başvuru kalıcı olarak silindi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onSearch(e?: FormEvent) {
    e?.preventDefault();
    setQ(qInput.trim());
  }

  function changeFilter(next: string) {
    setFilter(next);
    // Aynı arama metni yeni filtrede de geçerli kalsın
  }

  return (
    <div>
      <PageHeader title="Üye Başvuruları" desc="Yeni kayıtları onaylayın veya reddedin" />
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { v: "beklemede", l: "Bekleyen" },
          { v: "reddedildi", l: "Reddedilen" },
          { v: "all", l: "Tümü" },
        ].map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => changeFilter(f.v)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              filter === f.v ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <form onSubmit={onSearch} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <HiOutlineSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Ad, soyad, T.C. veya telefon ara..."
            className="min-h-11 w-full rounded-xl border border-border bg-white pr-3 pl-9 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Ara</Button>
          {q ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQInput("");
                setQ("");
              }}
            >
              Temizle
            </Button>
          ) : null}
        </div>
      </form>

      {isLoading || !data ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : data.length === 0 ? (
        <Empty text={q ? "Aramayla eşleşen başvuru yok" : "Başvuru yok"} />
      ) : (
        <div className="space-y-3">
          {data.map((m) => (
            <Card key={m.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-bold">
                    {m.firstName} {m.lastName}
                  </div>
                  <div className="text-xs text-muted">
                    Başvuru: {m.appliedAt ? new Date(m.appliedAt).toLocaleString("tr-TR") : "—"}
                  </div>
                </div>
                <Badge tone={statusTone(m.status)}>{statusLabel[m.status] || m.status}</Badge>
              </div>
              <div className="grid gap-1 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted">T.C.: </span>
                  {m.nationalId || "—"}
                </div>
                <div>
                  <span className="text-muted">Telefon: </span>
                  {m.phone || "—"}
                </div>
                <div>
                  <span className="text-muted">E-posta: </span>
                  {m.email || "—"}
                </div>
                <div>
                  <span className="text-muted">Doğum: </span>
                  {m.birthDate ? formatDueDate(m.birthDate) : "—"}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted">Adres: </span>
                  {m.address || "—"}
                </div>
                <div>
                  <span className="text-muted">Meslek: </span>
                  {m.profession || "—"}
                </div>
                {m.rejectReason ? (
                  <div className="sm:col-span-2 text-red-600">
                    <span className="text-muted">Red nedeni: </span>
                    {m.rejectReason}
                  </div>
                ) : null}
              </div>

              {m.status === "beklemede" ? (
                rejectId === m.id ? (
                  <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <Input
                      label="Red nedeni (opsiyonel)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="danger"
                        disabled={reject.isPending}
                        onClick={() => reject.mutate({ id: m.id, reason })}
                      >
                        Reddet
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setRejectId(null)}>
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={approve.isPending}
                      onClick={() => approve.mutate(m.id)}
                    >
                      Onayla
                    </Button>
                    <Button type="button" variant="danger" onClick={() => setRejectId(m.id)}>
                      Reddet
                    </Button>
                  </div>
                )
              ) : m.status === "reddedildi" ? (
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => approve.mutate(m.id)}>
                    Yeniden onayla
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={remove.isPending}
                    onClick={() =>
                      setDeleteTarget({
                        id: m.id,
                        name: `${m.firstName} ${m.lastName}`.trim(),
                        nationalId: m.nationalId,
                      })
                    }
                  >
                    Sil
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Başvuru silinsin mi?"
        message={
          deleteTarget
            ? `${deleteTarget.name}${deleteTarget.nationalId ? ` (T.C. ${deleteTarget.nationalId})` : ""} başvurusu kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : ""
        }
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={remove.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { formatDueDate, statusLabel, todayISO } from "@/lib/format";
import { useToast } from "@/lib/toast";
import { useSelectionMode } from "@/hooks/useSelectionMode";
import { Badge, Button, Card, Empty, Input, PageHeader, Textarea, statusTone } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import SelectionBar from "@/components/SelectionBar";
import {
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineMail,
  HiOutlinePencil,
  HiOutlineTrash,
} from "react-icons/hi";

type EventItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  status: string;
  description: string;
};

const emptyEventForm = {
  title: "",
  date: todayISO(),
  time: "",
  location: "",
  attendees: "0",
  status: "yaklasan",
  description: "",
};

export default function EventsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const selection = useSelectionMode();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleteOne, setDeleteOne] = useState<EventItem | null>(null);
  const [form, setForm] = useState(emptyEventForm);

  const { data = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => api<EventItem[]>("/events"),
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["events"] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
  }

  function closeForm() {
    setOpen(false);
    setEditId(null);
    setForm({ ...emptyEventForm, date: todayISO() });
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyEventForm, date: todayISO() });
    setOpen(true);
  }

  function openEdit(e: EventItem) {
    setEditId(e.id);
    setForm({
      title: e.title,
      date: e.date || todayISO(),
      time: e.time || "",
      location: e.location || "",
      attendees: String(e.attendees ?? 0),
      status: e.status === "tamamlandi" ? "tamamlandi" : "yaklasan",
      description: e.description || "",
    });
    setOpen(true);
  }

  const create = useMutation({
    mutationFn: () =>
      api("/events", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          attendees: Number(form.attendees) || 0,
          status: form.status,
        }),
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success("Etkinlik eklendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Etkinlik eklenemedi"),
  });

  const update = useMutation({
    mutationFn: () =>
      api(`/events/${editId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title,
          date: form.date,
          time: form.time,
          location: form.location,
          attendees: Number(form.attendees) || 0,
          status: form.status,
          description: form.description,
        }),
      }),
    onSuccess: () => {
      invalidate();
      closeForm();
      toast.success("Etkinlik güncellendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Güncellenemedi"),
  });

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api(`/events/${id}`, { method: "DELETE" })));
    },
    onSuccess: (_d, ids) => {
      invalidate();
      setConfirmDel(false);
      setDeleteOne(null);
      selection.exit();
      toast.success(`${ids.length} etkinlik silindi`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Silinemedi"),
  });

  const notify = useMutation({
    mutationFn: (eventId: string) =>
      api<{ sent: number; failed: number }>("/notifications/event-notice", {
        method: "POST",
        body: JSON.stringify({ eventId, channel: "both" }),
      }),
    onSuccess: (res) => {
      toast.success(`Bildirim: ${res.sent} üye${res.failed ? `, ${res.failed} hata` : ""}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gönderilemedi"),
  });

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (editId) update.mutate();
    else create.mutate();
  }

  const saving = create.isPending || update.isPending;

  return (
    <div className={selection.selecting ? "pb-20" : ""}>
      <PageHeader
        title="Etkinlikler"
        desc={selection.selecting ? "Seçim modu" : "Basılı tutarak çoklu seç"}
        action={
          !selection.selecting ? (
            <Button onClick={openCreate}>
              <HiOutlinePlus className="h-5 w-5" /> Yeni
            </Button>
          ) : undefined
        }
      />
      {isLoading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : data.length === 0 ? (
        <Empty text="Etkinlik yok" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((e) => {
            const on = selection.isSelected(e.id);
            return (
              <div key={e.id} {...selection.bindItem(e.id)}>
                <Card
                  className={`select-none transition ${
                    on ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-200" : ""
                  }`}
                  onClick={() => selection.handleClick(e.id)}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {selection.selecting && (
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                            on ? "bg-brand-600 text-white" : "border border-border bg-white text-transparent"
                          }`}
                        >
                          <HiOutlineCheck className="h-4 w-4" />
                        </span>
                      )}
                      <h3 className="font-bold">{e.title}</h3>
                    </div>
                    <Badge tone={statusTone(e.status)}>{statusLabel[e.status]}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted">
                    <div>
                      {e.date ? formatDueDate(e.date) : "Tarih yok"} {e.time && `· ${e.time}`}
                    </div>
                    <div>{e.location || "Konum yok"}</div>
                    <div>{e.attendees} katılımcı</div>
                    {e.description ? <p className="line-clamp-2 pt-1 text-slate-600">{e.description}</p> : null}
                  </div>
                  {!selection.selecting && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="!min-h-9 !text-xs"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          openEdit(e);
                        }}
                      >
                        <HiOutlinePencil className="h-4 w-4" /> Düzenle
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        className="!min-h-9 !text-xs"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setDeleteOne(e);
                        }}
                      >
                        <HiOutlineTrash className="h-4 w-4" /> Sil
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="!min-h-9 !text-xs"
                        disabled={notify.isPending}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          notify.mutate(e.id);
                        }}
                      >
                        <HiOutlineMail className="h-4 w-4" /> Üyelere bildir
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
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
        title={`${selection.count} etkinlik silinsin mi?`}
        message="Seçili etkinlikler kalıcı olarak silinir."
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={removeMany.isPending}
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => removeMany.mutate(selection.ids)}
      />

      <ConfirmDialog
        open={!!deleteOne}
        title="Etkinlik silinsin mi?"
        message={
          deleteOne
            ? `"${deleteOne.title}" kaydı kalıcı olarak silinecek.`
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

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <Card className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-b-none !p-5 sm:rounded-2xl">
            <h3 className="mb-4 text-lg font-bold">{editId ? "Etkinlik Düzenle" : "Yeni Etkinlik"}</h3>
            <form className="space-y-3" onSubmit={onSubmit}>
              <Input
                label="Başlık"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Tarih"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                <Input
                  label="Saat"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
              <Input
                label="Konum"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <Input
                label="Katılımcı"
                type="number"
                value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: e.target.value })}
              />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-slate-700">Durum</span>
                <select
                  className="min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-50"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="yaklasan">Yaklaşan</option>
                  <option value="tamamlandi">Tamamlandı</option>
                </select>
              </label>
              <Textarea
                label="Açıklama"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div className="flex gap-2">
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
    </div>
  );
}

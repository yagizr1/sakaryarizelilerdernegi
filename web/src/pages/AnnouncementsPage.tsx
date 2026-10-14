import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Button, Card, Empty, Input, PageHeader, Textarea } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi";
import { formatDueDate, todayISO } from "@/lib/format";

type Item = { id: string; title: string; description: string; publishDate: string };

const emptyForm = { title: "", description: "", publishDate: todayISO() };

export default function AnnouncementsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteOne, setDeleteOne] = useState<Item | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data = [], isLoading } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => api<Item[]>("/announcements"),
  });

  function closeForm() {
    setOpen(false);
    setEditId(null);
    setForm({ ...emptyForm, publishDate: todayISO() });
  }

  function openCreate() {
    setEditId(null);
    setForm({ ...emptyForm, publishDate: todayISO() });
    setOpen(true);
  }

  function openEdit(a: Item) {
    setEditId(a.id);
    setForm({
      title: a.title,
      description: a.description || "",
      publishDate: a.publishDate || todayISO(),
    });
    setOpen(true);
  }

  const create = useMutation({
    mutationFn: () => api("/announcements", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      closeForm();
      toast.success("Duyuru yayınlandı");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Duyuru eklenemedi"),
  });

  const update = useMutation({
    mutationFn: () =>
      api(`/announcements/${editId}`, {
        method: "PUT",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      closeForm();
      toast.success("Duyuru güncellendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Güncellenemedi"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/announcements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteOne(null);
      toast.success("Duyuru silindi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Silinemedi"),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (editId) update.mutate();
    else create.mutate();
  }

  const saving = create.isPending || update.isPending;

  return (
    <div>
      <PageHeader
        title="Duyurular"
        action={
          <Button onClick={openCreate}>
            <HiOutlinePlus className="h-5 w-5" /> Yeni
          </Button>
        }
      />
      {isLoading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : data.length === 0 ? (
        <Empty text="Duyuru yok" />
      ) : (
        <div className="space-y-3">
          {data.map((a) => (
            <Card key={a.id}>
              <h3 className="font-bold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted">{a.description}</p>
              <p className="mt-2 text-xs text-slate-400">{formatDueDate(a.publishDate)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="!min-h-9 !text-xs"
                  onClick={() => openEdit(a)}
                >
                  <HiOutlinePencil className="h-4 w-4" /> Düzenle
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="!min-h-9 !text-xs"
                  onClick={() => setDeleteOne(a)}
                >
                  <HiOutlineTrash className="h-4 w-4" /> Sil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteOne}
        title="Duyuru silinsin mi?"
        message={deleteOne ? `"${deleteOne.title}" kaydı kalıcı olarak silinecek.` : ""}
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={remove.isPending}
        onCancel={() => setDeleteOne(null)}
        onConfirm={() => {
          if (deleteOne) remove.mutate(deleteOne.id);
        }}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <Card className="w-full max-w-lg rounded-b-none !p-5 sm:rounded-2xl">
            <h3 className="mb-4 text-lg font-bold">{editId ? "Duyuru Düzenle" : "Yeni Duyuru"}</h3>
            <form className="space-y-3" onSubmit={onSubmit}>
              <Input
                label="Başlık"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Textarea
                label="Açıklama"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                label="Yayın Tarihi"
                type="date"
                value={form.publishDate}
                onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
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

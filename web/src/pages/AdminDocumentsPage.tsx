import { FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiDownload, ApiError } from "@/lib/api";
import { Button, Card, Empty, Input, PageHeader } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/lib/toast";
import { formatDueDate } from "@/lib/format";
import { HiOutlineDownload, HiOutlineTrash, HiOutlineUpload } from "react-icons/hi";

type Doc = {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  storageKey?: string;
};

export default function AdminDocumentsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [deleteOne, setDeleteOne] = useState<Doc | null>(null);
  const [dlBusy, setDlBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: () => api<Doc[]>("/documents"),
  });

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new ApiError(400, "Dosya seçin");
      const fd = new FormData();
      fd.append("file", file);
      if (name.trim()) fd.append("name", name.trim());
      return api<Doc>("/documents", { method: "POST", body: fd });
    },
    onSuccess: () => {
      setName("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["admin-documents"] });
      toast.success("Belge yüklendi");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Yüklenemedi"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/documents/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      setDeleteOne(null);
      qc.invalidateQueries({ queryKey: ["admin-documents"] });
      toast.success("Belge silindi");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Silinemedi"),
  });

  async function onDownload(d: Doc) {
    if (dlBusy) return;
    setDlBusy(true);
    try {
      await apiDownload(`/documents/${d.id}/download`, d.name);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "İndirilemedi");
    } finally {
      setDlBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Önce dosya seçin");
      fileRef.current?.click();
      return;
    }
    upload.mutate();
  }

  return (
    <div>
      <PageHeader title="Belgeler" desc="Cihazdan belge yükleyin, indirin veya silin" />
      <Card className="mb-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            label="Belge adı (opsiyonel)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Boş bırakırsanız dosya adı kullanılır"
          />

          <div className="space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Dosya</span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.zip"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                Dosya seç
              </Button>
              <span className="text-sm text-muted">
                {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : "En fazla 20 MB"}
              </span>
            </div>
          </div>

          <Button type="submit" disabled={upload.isPending}>
            <HiOutlineUpload className="h-5 w-5" />
            {upload.isPending ? "Yükleniyor..." : "Yükle"}
          </Button>
        </form>
      </Card>

      {isLoading || !data ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : data.length === 0 ? (
        <Empty text="Belge yok" />
      ) : (
        <div className="space-y-2">
          {data.map((d) => (
            <Card key={d.id} className="flex flex-wrap items-center justify-between gap-3 !py-3">
              <div className="min-w-0">
                <div className="truncate font-semibold">{d.name}</div>
                <div className="text-xs text-muted">
                  {d.type.toUpperCase()}
                  {d.size ? ` · ${d.size}` : ""}
                  {d.date ? ` · ${formatDueDate(d.date)}` : ""}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="!min-h-9 !text-xs"
                  disabled={dlBusy}
                  onClick={() => onDownload(d)}
                >
                  <HiOutlineDownload className="h-4 w-4" />
                  İndir
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="!min-h-9 !text-xs"
                  onClick={() => setDeleteOne(d)}
                >
                  <HiOutlineTrash className="h-4 w-4" />
                  Sil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteOne}
        title="Belge silinsin mi?"
        message={deleteOne ? `"${deleteOne.name}" kalıcı olarak silinecek.` : ""}
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={remove.isPending}
        onCancel={() => setDeleteOne(null)}
        onConfirm={() => {
          if (deleteOne) remove.mutate(deleteOne.id);
        }}
      />
    </div>
  );
}

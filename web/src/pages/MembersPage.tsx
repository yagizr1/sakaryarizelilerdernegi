import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, getToken } from "@/lib/api";
import { DUTY_OPTIONS, dutyLabel, initials, statusLabel } from "@/lib/format";
import { useToast } from "@/lib/toast";
import { useSelectionMode } from "@/hooks/useSelectionMode";
import { Badge, Button, Card, Empty, PageHeader, Select, statusTone } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import SelectionBar from "@/components/SelectionBar";
import {
  HiOutlineCheck,
  HiOutlineDownload,
  HiOutlineSearch,
  HiOutlineUpload,
  HiOutlineUserGroup,
} from "react-icons/hi";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profession: string;
  nationalId: string;
  status: string;
  duty: string;
  joinDate: string;
  debt: number;
};

type Mode = "delete" | "duty";

export default function MembersPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const selection = useSelectionMode();
  const [mode, setMode] = useState<Mode>("delete");
  const [dutyPick, setDutyPick] = useState("baskan");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [dutyFilter, setDutyFilter] = useState("all");
  const [confirmDel, setConfirmDel] = useState(false);
  const [excelBusy, setExcelBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [withNewPasswords, setWithNewPasswords] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["members", q, status, dutyFilter],
    queryFn: () =>
      api<Member[]>(
        `/members?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&duty=${encodeURIComponent(dutyFilter)}`
      ),
  });

  async function downloadMembersExcel(path: string, fallbackName: string) {
    const headers = new Headers();
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`/api${path}`, { headers });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      throw new ApiError(res.status, data.message || "İndirme başarısız");
    }
    const blob = await res.blob();
    const cd = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename="?([^";]+)"?/i);
    const filename = match?.[1] || fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onDownloadTemplate() {
    setExcelBusy(true);
    try {
      await downloadMembersExcel("/members/excel/template", "srd-uye-sablonu.xlsx");
      toast.success("Örnek Excel şablonu indirildi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Şablon indirilemedi");
    } finally {
      setExcelBusy(false);
    }
  }

  async function onExportMembers() {
    setExcelBusy(true);
    try {
      const qs = withNewPasswords ? "?withNewPasswords=1" : "";
      await downloadMembersExcel(`/members/excel/export${qs}`, "uyeler.xlsx");
      toast.success(
        withNewPasswords
          ? "Üyeler dışa aktarıldı; geçici şifreler Excel’de (eski şifreler değişti)"
          : "Üyeler Excel’e aktarıldı (şifreler güvenlik nedeniyle boş)"
      );
      setExportOpen(false);
      setWithNewPasswords(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dışa aktarım başarısız");
    } finally {
      setExcelBusy(false);
    }
  }

  async function onImportFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setExcelBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const headers = new Headers();
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch("/api/members/excel/import", {
        method: "POST",
        headers,
        body,
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        created?: number;
        updated?: number;
        errors?: string[];
      };
      if (!res.ok) throw new ApiError(res.status, data.message || "İçe aktarım başarısız");
      await qc.invalidateQueries({ queryKey: ["members"] });
      await qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(data.message || "İçe aktarım tamam");
      if (data.errors?.length) {
        console.warn("Üye Excel uyarıları:", data.errors);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İçe aktarım başarısız");
    } finally {
      setExcelBusy(false);
      if (importRef.current) importRef.current.value = "";
    }
  }

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => api(`/members/${id}`, { method: "DELETE" })));
    },
    onSuccess: (_d, ids) => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["dues"] });
      setConfirmDel(false);
      selection.exit();
      setMode("delete");
      toast.success(`${ids.length} üye silindi`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Silinemedi"),
  });

  const assignDuty = useMutation({
    mutationFn: () =>
      api<{ updated: number }>("/members/bulk-duty", {
        method: "POST",
        body: JSON.stringify({ memberIds: selection.ids, duty: dutyPick }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      selection.exit();
      setMode("delete");
      toast.success(`${res.updated} üyeye yetki verildi: ${dutyLabel[dutyPick] || dutyPick}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Yetki verilemedi"),
  });

  function startDutyMode() {
    setMode("duty");
    selection.enter();
  }

  function cancelSelection() {
    selection.exit();
    setMode("delete");
  }

  return (
    <div className={selection.selecting ? "pb-28" : ""}>
      <PageHeader
        title="Üyeler"
        desc={
          selection.selecting
            ? mode === "duty"
              ? "Yetki vermek için üye seçin"
              : "Seçim modu"
            : "Basılı tutarak çoklu seç · Yetki ver ile görev ata"
        }
        action={
          !selection.selecting ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={excelBusy} onClick={onDownloadTemplate}>
                <HiOutlineDownload className="h-5 w-5" /> Şablon
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={excelBusy}
                onClick={() => setExportOpen(true)}
              >
                <HiOutlineDownload className="h-5 w-5" /> Excel’e aktar
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={excelBusy}
                onClick={() => importRef.current?.click()}
              >
                <HiOutlineUpload className="h-5 w-5" /> Excel’den yükle
              </Button>
              <Button type="button" variant="secondary" onClick={startDutyMode}>
                <HiOutlineUserGroup className="h-5 w-5" /> Yetki ver
              </Button>
            </div>
          ) : undefined
        }
      />

      <input
        ref={importRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => void onImportFile(e.target.files)}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ad, TC, telefon ara..."
            className="min-h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-36">
          <option value="all">Tümü</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </Select>
        <Select value={dutyFilter} onChange={(e) => setDutyFilter(e.target.value)} className="sm:w-48">
          <option value="all">Tüm yetkiler</option>
          {DUTY_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Yükleniyor...</p>
      ) : data.length === 0 ? (
        <Empty text="Henüz onaylı üye yok. Başvurular bölümünden onaylayın." />
      ) : (
        <div className="space-y-2">
          {data.map((m) => {
            const on = selection.isSelected(m.id);
            return (
              <div key={m.id} {...selection.bindItem(m.id)}>
                <Card
                  className={`mb-2 !p-3 transition select-none ${
                    on ? "border-brand-500 bg-brand-50/60 ring-1 ring-brand-200" : "hover:border-brand-200"
                  }`}
                  onClick={() => {
                    if (selection.handleClick(m.id)) return;
                    navigate(`/admin/members/${m.id}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`grid h-11 w-11 place-items-center rounded-full text-sm font-bold ${
                        on ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-700"
                      }`}
                    >
                      {on ? <HiOutlineCheck className="h-5 w-5" /> : initials(m.firstName, m.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {m.phone || "Telefon yok"}
                        {m.profession ? ` · ${m.profession}` : ""}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {m.duty && m.duty !== "uye" && (
                        <Badge tone="primary">{dutyLabel[m.duty] || m.duty}</Badge>
                      )}
                      <Badge tone={statusTone(m.status)}>{statusLabel[m.status]}</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {selection.selecting && mode === "duty" ? (
        <div className="fixed inset-x-0 bottom-16 z-40 px-3 pb-[env(safe-area-inset-bottom)] lg:bottom-4">
          <div className="mx-auto flex max-w-lg flex-col gap-2 rounded-2xl border border-border bg-white p-3 shadow-lg lg:max-w-xl">
            <div className="text-sm font-semibold">{selection.count} üye seçili</div>
            <Select label="Yetki / Görev" value={dutyPick} onChange={(e) => setDutyPick(e.target.value)}>
              {DUTY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={cancelSelection}>
                Vazgeç
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={selection.count === 0 || assignDuty.isPending}
                onClick={() => assignDuty.mutate()}
              >
                {assignDuty.isPending ? "Atanıyor..." : "Yetkiyi ata"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <SelectionBar
          count={selection.count}
          onCancel={cancelSelection}
          onDelete={() => setConfirmDel(true)}
          deleting={removeMany.isPending}
        />
      )}

      <ConfirmDialog
        open={confirmDel}
        title={`${selection.count} üye silinsin mi?`}
        message="Seçili üyeler ve bağlı aidat kayıtları kalıcı olarak silinir."
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={removeMany.isPending}
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => removeMany.mutate(selection.ids)}
      />

      {exportOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-4">
          <Card className="w-full max-w-md rounded-b-none !p-5 sm:rounded-2xl">
            <h3 className="text-lg font-bold">Üyeleri Excel’e aktar</h3>
            <p className="mt-2 text-sm text-muted">
              Kayıtlı şifreler hash’lendiği için geri getirilemez. İsterseniz her üyeye yeni geçici
              şifre üretip Excel’e yazabilirsiniz (mevcut giriş şifreleri değişir).
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-slate-50 p-3">
              <input
                type="checkbox"
                className="mt-1"
                checked={withNewPasswords}
                onChange={(e) => setWithNewPasswords(e.target.checked)}
              />
              <span className="text-sm">
                <span className="font-semibold text-slate-800">Yeni geçici şifreler üret</span>
                <span className="mt-0.5 block text-xs text-muted">
                  Excel’deki <code>sifre</code> sütununa yazılır ve sistemde güncellenir.
                </span>
              </span>
            </label>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={excelBusy}
                onClick={() => {
                  setExportOpen(false);
                  setWithNewPasswords(false);
                }}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={excelBusy}
                onClick={() => void onExportMembers()}
              >
                {excelBusy ? "Hazırlanıyor..." : "İndir"}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

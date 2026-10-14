import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { initials, money, statusLabel, dutyLabel, effectiveDueStatus, formatDueDate, formatDueMonth } from "@/lib/format";
import { useToast } from "@/lib/toast";
import { Badge, Button, Card, Empty, PageHeader, statusTone } from "@/components/ui";
import ConfirmDialog from "@/components/ConfirmDialog";
import { HiOutlineArrowLeft, HiOutlineTrash } from "react-icons/hi";

type MemberDetail = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  profession: string;
  nationalId: string;
  birthDate: string;
  status: string;
  duty: string;
  joinDate: string;
  debt: number;
  dues: Array<{ id: string; amount: number; dueDate: string; status: string; receipt: string }>;
};

export default function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["member", id],
    queryFn: () => api<MemberDetail>(`/members/${id}`),
    enabled: !!id,
  });

  const remove = useMutation({
    mutationFn: () => api(`/members/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setConfirmOpen(false);
      toast.success("Üye silindi");
      navigate("/admin/members");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Üye silinemedi");
    },
  });

  const setStatus = useMutation({
    mutationFn: (status: "aktif" | "pasif") =>
      api(`/members/${id}`, { method: "PUT", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member", id] });
      qc.invalidateQueries({ queryKey: ["members"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Üye durumu güncellendi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Güncellenemedi"),
  });

  if (isLoading || !data) return <p className="text-sm text-muted">Yükleniyor...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Link to="/admin/members" className="rounded-xl p-2 hover:bg-white">
          <HiOutlineArrowLeft className="h-5 w-5" />
        </Link>
        <PageHeader title="Üye Detayı" desc={`${data.firstName} ${data.lastName}`} />
      </div>

      <Card className="mb-4">
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-lg font-bold text-brand-700">
            {initials(data.firstName, data.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">
                {data.firstName} {data.lastName}
              </h2>
              <Badge tone={statusTone(data.status)}>{statusLabel[data.status]}</Badge>
              {data.duty && (
                <Badge tone={data.duty === "uye" ? "neutral" : "primary"}>
                  {dutyLabel[data.duty] || data.duty}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">{data.profession || "Meslek belirtilmemiş"}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            ["TC Kimlik", data.nationalId],
            ["Doğum Tarihi", formatDueDate(data.birthDate)],
            ["Telefon", data.phone],
            ["E-posta", data.email],
            ["Meslek", data.profession],
            ["Yetki / Görev", dutyLabel[data.duty] || data.duty || "Üye"],
            ["Üyelik Tarihi", formatDueDate(data.joinDate)],
            ["Borç", money(data.debt)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-muted">{label}</div>
              <div className="font-semibold whitespace-pre-wrap">{value || "—"}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.status === "aktif" ? (
            <Button
              type="button"
              variant="secondary"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("pasif")}
            >
              Pasife Al
            </Button>
          ) : (
            <Button
              type="button"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("aktif")}
            >
              Aktifleştir
            </Button>
          )}
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            <HiOutlineTrash className="h-4 w-4" /> Sil
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-bold">Aidat Geçmişi</h3>
        {data.dues.length === 0 ? (
          <Empty text="Aidat kaydı yok" />
        ) : (
          <div className="space-y-2">
            {data.dues.map((d) => {
              const st = effectiveDueStatus(d.status, d.dueDate);
              return (
                <div key={d.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <div>
                    <div className="font-semibold">{money(d.amount)}</div>
                    <div className="text-xs text-muted">
                      {formatDueMonth(d.dueDate)} · Son ödeme {formatDueDate(d.dueDate)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone="primary">{formatDueMonth(d.dueDate)}</Badge>
                    <Badge tone={statusTone(st)}>{statusLabel[st]}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Üye silinsin mi?"
        message={`${data.firstName} ${data.lastName} kalıcı olarak silinecek. Bu işlem geri alınamaz.`}
        confirmLabel="Evet, sil"
        cancelLabel="Vazgeç"
        danger
        loading={remove.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

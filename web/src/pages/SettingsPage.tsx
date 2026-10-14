import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { Button, Card, Input, PageHeader, Textarea } from "@/components/ui";
import { toDateInputValue } from "@/lib/format";

type Setting = {
  name: string;
  shortName: string;
  founded: string;
  taxNo: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  monthlyDueAmount: number;
  monthlyDueFixed: boolean;
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<Setting>({
    name: "",
    shortName: "",
    founded: "",
    taxNo: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    monthlyDueAmount: 0,
    monthlyDueFixed: false,
  });

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Setting>("/settings"),
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        shortName: data.shortName || "",
        founded: toDateInputValue(data.founded || ""),
        taxNo: data.taxNo || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        monthlyDueAmount: Number(data.monthlyDueAmount) || 0,
        monthlyDueFixed: Boolean(data.monthlyDueFixed),
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      if (form.monthlyDueFixed && !(Number(form.monthlyDueAmount) > 0)) {
        return Promise.reject(new Error("Sabit aidat açıkken tutar zorunludur"));
      }
      return api("/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...form,
          monthlyDueAmount: Number(form.monthlyDueAmount) || 0,
          monthlyDueFixed: form.monthlyDueFixed,
        }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Ayarlar kaydedildi");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Kaydedilemedi"),
  });

  return (
    <div>
      <PageHeader title="Ayarlar" desc="Dernek bilgileri" />
      <Card>
        <form
          className="space-y-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Input label="Dernek Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Kısa Ad"
              value={form.shortName}
              onChange={(e) => setForm({ ...form, shortName: e.target.value })}
            />
            <Input
              label="Kuruluş Tarihi"
              type="date"
              value={form.founded}
              onChange={(e) => setForm({ ...form, founded: e.target.value })}
            />
          </div>
          <Input label="Vergi No" value={form.taxNo} onChange={(e) => setForm({ ...form, taxNo: e.target.value })} />
          <Textarea
            label="Adres"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label="E-posta" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input
            label="Web"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />

          <div className="rounded-2xl border border-border bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-slate-800">Sabit aylık aidat</div>
                <p className="mt-0.5 text-xs text-muted">
                  {form.monthlyDueFixed
                    ? "Açık: tutar zorunlu, ay aidatı bu tutarla oluşturulur"
                    : "Kapalı: her kayıtta istediğiniz tutarı girebilirsiniz"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.monthlyDueFixed}
                onClick={() => setForm((f) => ({ ...f, monthlyDueFixed: !f.monthlyDueFixed }))}
                className={`relative h-8 w-14 shrink-0 rounded-full transition ${
                  form.monthlyDueFixed ? "bg-brand-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition ${
                    form.monthlyDueFixed ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {form.monthlyDueFixed ? (
              <div className="mt-3 space-y-1.5">
                <Input
                  label="Aylık aidat tutarı (₺) *"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={String(form.monthlyDueAmount || "")}
                  onChange={(e) =>
                    setForm({ ...form, monthlyDueAmount: Number(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted">
                  Aidatlar → “Bu ay aidatlarını oluştur” bu tutarı kullanır.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Pasif: “Bu ay aidatlarını oluştur” yine çalışır; tutar sabit olmaz, kim ne yatırdıysa
                kayda yazılır.
              </p>
            )}
          </div>

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

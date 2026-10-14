import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/lib/toast";

type Profile = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  birthDate: string;
  profession: string;
  photoUrl: string;
  nationalId: string;
  memberNo: string;
  status: string;
};

export default function MemberProfilePage() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["member-profile"],
    queryFn: () => api<Profile>("/member/profile"),
  });
  const [form, setForm] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api("/member/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          birthDate: form.birthDate,
          profession: form.profession,
          photoUrl: form.photoUrl,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member-profile"] });
      toast.success("Profil güncellendi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) return <p className="text-sm member-muted">Yükleniyor...</p>;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="member-card space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Ad"
            value={form.firstName || ""}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label="Soyad"
            value={form.lastName || ""}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="T.C. Kimlik No" value={data.nationalId} disabled className="opacity-70" />
          <Input label="Üye No" value={data.memberNo || "—"} disabled className="opacity-70" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Telefon"
            value={form.phone || ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="E-posta"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Doğum tarihi"
            type="date"
            value={form.birthDate || ""}
            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
          />
          <Input
            label="Meslek"
            value={form.profession || ""}
            onChange={(e) => setForm({ ...form, profession: e.target.value })}
          />
        </div>
        <Input
          label="Adres"
          value={form.address || ""}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <Input
          label="Profil fotoğrafı (URL)"
          value={form.photoUrl || ""}
          onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
          placeholder="https://..."
        />
      </div>
      <Button type="submit" disabled={save.isPending} className="w-full sm:w-auto">
        {save.isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}

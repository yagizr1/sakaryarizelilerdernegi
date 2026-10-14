import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/lib/toast";

export default function MemberSettingsPage() {
  const { logout } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["member-profile"],
    queryFn: () => api<{ notifyEmail: boolean; notifySms: boolean }>("/member/profile"),
  });
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setNotifyEmail(profile.notifyEmail);
      setNotifySms(profile.notifySms);
    }
  }, [profile]);

  const saveNotify = useMutation({
    mutationFn: () =>
      api("/member/settings", {
        method: "PATCH",
        body: JSON.stringify({ notifyEmail, notifySms }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["member-profile"] });
      toast.success("Bildirim ayarları kaydedildi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePass = useMutation({
    mutationFn: () =>
      api("/auth/member/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Şifre güncellendi");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function onPass(e: FormEvent) {
    e.preventDefault();
    changePass.mutate();
  }

  return (
    <div className="space-y-4">
      <section className="member-card space-y-3">
        <h3 className="member-section-title">Bildirim ayarları</h3>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#eef1f5] bg-[#f8fafb] px-3 text-sm">
          <span className="font-medium text-[#1a2b4b]">E-posta bildirimleri</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#2f7a3e]"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
          />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#eef1f5] bg-[#f8fafb] px-3 text-sm">
          <span className="font-medium text-[#1a2b4b]">SMS bildirimleri</span>
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#2f7a3e]"
            checked={notifySms}
            onChange={(e) => setNotifySms(e.target.checked)}
          />
        </label>
        <Button
          type="button"
          onClick={() => saveNotify.mutate()}
          disabled={saveNotify.isPending}
          className="w-full sm:w-auto"
        >
          Kaydet
        </Button>
      </section>

      <section className="member-card">
        <h3 className="member-section-title mb-3">Şifre değiştir</h3>
        <form onSubmit={onPass} className="space-y-3">
          <Input
            label="Mevcut şifre"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            label="Yeni şifre"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" disabled={changePass.isPending} className="w-full sm:w-auto">
            Şifreyi Güncelle
          </Button>
        </form>
      </section>

      <Button type="button" variant="danger" className="w-full" onClick={logout}>
        Hesaptan çıkış
      </Button>
    </div>
  );
}

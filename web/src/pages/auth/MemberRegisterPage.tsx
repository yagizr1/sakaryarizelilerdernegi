import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth, homeForRole } from "@/lib/auth";
import { Button, Input } from "@/components/ui";

export default function MemberRegisterPage() {
  const { user, loading } = useAuth();
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    phone: "",
    email: "",
    birthDate: "",
    address: "",
    profession: "",
    password: "",
    password2: "",
  });

  if (!loading && user) return <Navigate to={homeForRole(user.role)} replace />;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    if (form.nationalId.replace(/\D/g, "").length !== 11) {
      setError("T.C. Kimlik No 11 haneli olmalı");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/auth/member/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          nationalId: form.nationalId.replace(/\D/g, ""),
          phone: form.phone,
          email: form.email,
          birthDate: form.birthDate,
          address: form.address,
          profession: form.profession,
          password: form.password,
        }),
      });
      setMessage(res.message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen relative flex min-h-[100dvh] items-center justify-center px-4 py-8">
      <div className="login-screen__texture pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-[#e4e8ef] bg-white/95 p-5 shadow-lg sm:p-6">
        <div className="mb-5 text-center">
          <img
            src="/logo-sakarya-rizeliler-v2.png"
            alt=""
            className="mx-auto mb-3 h-16 w-16 rounded-full object-cover ring-2 ring-white"
          />
          <h1 className="text-xl font-bold text-[#1a2b4b]">Üye Başvurusu</h1>
          <p className="mt-1 text-sm text-[#5b6578]">Başvurunuz yönetici onayından sonra aktif olur</p>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <p className="rounded-xl bg-emerald-50 px-4 py-4 text-sm font-medium leading-relaxed text-emerald-800">
              {message ||
                "Başvurunuz başarıyla alındı. Yönetici onayından sonra hesabınız aktif hale gelecektir."}
            </p>
            <Link to="/login" className="inline-block text-sm font-bold text-[#2f7a3e]">
              Üye girişine dön
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <Input label="Ad" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
            <Input label="Soyad" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
            <Input
              label="T.C. Kimlik No"
              value={form.nationalId}
              onChange={(e) => set("nationalId", e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="numeric"
              required
              className="sm:col-span-2"
            />
            <Input label="Telefon" value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
            <Input label="E-posta" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            <Input
              label="Doğum tarihi"
              type="date"
              value={form.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
            />
            <Input label="Meslek" value={form.profession} onChange={(e) => set("profession", e.target.value)} />
            <div className="sm:col-span-2">
              <Input label="Adres" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <Input
              label="Şifre"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              required
              minLength={6}
            />
            <Input
              label="Şifre tekrar"
              type="password"
              value={form.password2}
              onChange={(e) => set("password2", e.target.value)}
              required
              minLength={6}
            />
            {error ? (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">{error}</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
              <Link to="/login" className="text-sm text-[#5b6578] hover:text-[#1a2b4b]">
                ← Girişe dön
              </Link>
              <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                {busy ? "Gönderiliyor..." : "Başvuruyu Gönder"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

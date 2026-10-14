import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { HiOutlineLockClosed, HiOutlineIdentification } from "react-icons/hi";
import { useAuth, homeForRole } from "@/lib/auth";

export default function LoginGatePage() {
  const { user, loading, loginMember } = useAuth();
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    if (user.role === "ADMIN") return <Navigate to="/login/admin" replace />;
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginMember(nationalId.replace(/\D/g, ""), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen relative flex min-h-[100dvh] items-center justify-center px-6 py-10">
      <div className="login-screen__texture pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative z-10 w-full max-w-[380px] animate-[slideUp_0.45s_ease-out]">
        <div className="mb-7 flex flex-col items-center text-center">
          <img
            src="/logo-sakarya-rizeliler-v2.png"
            alt="Sakarya Rizeliler Derneği"
            className="mb-5 h-[120px] w-[120px] rounded-full object-cover shadow-[0_8px_28px_rgba(15,40,80,0.18)] ring-4 ring-white"
          />
          <h1 className="text-[1.55rem] font-bold leading-tight tracking-tight text-[#1a2b4b]">
            Sakarya Rizeliler Derneği
          </h1>
          <p className="mt-1.5 text-sm text-[#5b6578]">T.C. Kimlik No ve şifrenizle giriş yapın</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="relative block">
            <span className="sr-only">T.C. Kimlik No</span>
            <HiOutlineIdentification className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-[#9aa3b2]" />
            <input
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="T.C. Kimlik No"
              inputMode="numeric"
              autoComplete="username"
              required
              minLength={11}
              maxLength={11}
              className="min-h-[52px] w-full rounded-xl border border-[#d7dbe3] bg-white pr-4 pl-11 text-[15px] text-[#1a2b4b] outline-none transition placeholder:text-[#a8b0bd] focus:border-[#2f7a3e] focus:ring-2 focus:ring-[#2f7a3e]/20"
            />
          </label>
          <label className="relative block">
            <span className="sr-only">Şifre</span>
            <HiOutlineLockClosed className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-[#9aa3b2]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifre"
              autoComplete="current-password"
              required
              className="min-h-[52px] w-full rounded-xl border border-[#d7dbe3] bg-white pr-4 pl-11 text-[15px] text-[#1a2b4b] outline-none transition placeholder:text-[#a8b0bd] focus:border-[#2f7a3e] focus:ring-2 focus:ring-[#2f7a3e]/20"
            />
          </label>
          {error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#2f7a3e] text-[15px] font-bold tracking-wide text-white uppercase shadow-[0_6px_18px_rgba(47,122,62,0.28)] transition hover:bg-[#276a35] disabled:opacity-60"
          >
            {busy ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[15px] text-[#3a4a66]">Hesabınız yok mu?</p>
          <Link
            to="/login/member/register"
            className="mt-1 inline-block text-[17px] font-bold text-[#2f7a3e] hover:text-[#276a35]"
          >
            Üye Ol
          </Link>
        </div>
      </div>
    </div>
  );
}

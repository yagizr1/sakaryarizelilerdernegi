import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDueDate, statusLabel } from "@/lib/format";

type CardData = {
  firstName: string;
  lastName: string;
  memberNo: string;
  status: string;
  joinDate: string;
  qrUrl: string;
};

export default function MemberCardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["member-card"],
    queryFn: () => api<CardData>("/member/card"),
  });

  if (isLoading || !data) return <p className="text-sm member-muted">Yükleniyor...</p>;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a2b4b] via-[#243a63] to-[#1f5c2e] p-5 text-white shadow-xl sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <img
            src="/logo-sakarya-rizeliler-v2.png"
            alt="Logo"
            className="h-14 w-14 rounded-full object-cover ring-2 ring-white/40"
          />
          <div>
            <div className="text-xs font-medium text-white/70">Sakarya Rizeliler Derneği</div>
            <div className="text-sm font-bold">Dijital Üyelik Kartı</div>
          </div>
        </div>
        <div className="mb-5">
          <div className="text-xl font-bold sm:text-2xl">
            {data.firstName} {data.lastName}
          </div>
          <div className="mt-2 text-sm text-white/80">Üye No: {data.memberNo || "—"}</div>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-300" />
            {statusLabel[data.status] || data.status}
          </div>
          <div className="mt-2 text-xs text-white/60">
            Üyelik: {data.joinDate ? formatDueDate(data.joinDate) : "—"}
          </div>
        </div>
        <div className="flex justify-center rounded-2xl bg-white p-4">
          <img src={data.qrUrl} alt="QR Kod" className="h-[160px] w-[160px] sm:h-[180px] sm:w-[180px]" />
        </div>
      </div>
    </div>
  );
}

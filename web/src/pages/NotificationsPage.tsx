import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_TEMPLATE, openWhatsAppChat } from "@/lib/whatsapp";
import { Badge, Button, Card, Empty, PageHeader, Select, Textarea, statusTone } from "@/components/ui";
import { HiOutlineMail, HiOutlinePaperAirplane, HiOutlineSearch } from "react-icons/hi";
import { FaWhatsapp } from "react-icons/fa";

type Recipient = { id: string; name: string; phone: string; email: string };
type Status = {
  mail: { enabled: boolean; configured: boolean; mock: boolean; from: string | null };
  templates: { dues_reminder: string; event_notice: string };
};
type Log = {
  id: string;
  channel: string;
  type: string;
  memberName: string;
  to: string;
  subject: string;
  body: string;
  status: string;
  error: string;
  createdAt: string;
};
type EventItem = { id: string; title: string; date: string; time: string; location: string };

export default function NotificationsPage() {
  const toast = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"send" | "whatsapp" | "dues" | "event" | "logs">("send");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("Dernek bilgilendirmesi");
  const [body, setBody] = useState("Sayın {ad} {soyad}, ...");
  const [waMessage, setWaMessage] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [eventId, setEventId] = useState("");
  const [duesBody, setDuesBody] = useState("");
  const [eventBody, setEventBody] = useState("");

  const { data: status } = useQuery({
    queryKey: ["notify-status"],
    queryFn: () => api<Status>("/notifications/status"),
  });

  const { data: recipients = [], isLoading } = useQuery({
    queryKey: ["notify-recipients", filter, q],
    queryFn: () =>
      api<Recipient[]>(
        `/notifications/recipients?filter=${encodeURIComponent(filter)}&q=${encodeURIComponent(q)}`
      ),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["notify-logs"],
    queryFn: () => api<Log[]>("/notifications/logs?limit=80"),
    enabled: tab === "logs",
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events"],
    queryFn: () => api<EventItem[]>("/events"),
    enabled: tab === "event",
  });

  type SendResult = { sent: number; failed: number };

  const send = useMutation({
    mutationFn: () =>
      api<SendResult>("/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          memberIds: [...selected],
          channel: "email",
          type: "custom",
          subject,
          body,
        }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["notify-logs"] });
      toast.success(`${res.sent} gönderildi${res.failed ? `, ${res.failed} başarısız` : ""}`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gönderilemedi"),
  });

  const sendDues = useMutation({
    mutationFn: () =>
      api<SendResult>("/notifications/dues-reminder", {
        method: "POST",
        body: JSON.stringify({
          channel: "email",
          body: duesBody || status?.templates.dues_reminder,
          memberIds: selected.size ? [...selected] : undefined,
        }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["notify-logs"] });
      toast.success(`Aidat hatırlatması: ${res.sent} gönderildi`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gönderilemedi"),
  });

  const sendEvent = useMutation({
    mutationFn: () =>
      api<SendResult>("/notifications/event-notice", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          channel: "email",
          body: eventBody || status?.templates.event_notice,
          memberIds: selected.size ? [...selected] : undefined,
        }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["notify-logs"] });
      toast.success(`Etkinlik bildirimi: ${res.sent} gönderildi`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Gönderilemedi"),
  });

  const allSelected = useMemo(
    () => recipients.length > 0 && recipients.every((r) => selected.has(r.id)),
    [recipients, selected]
  );

  const selectedRecipients = useMemo(
    () => recipients.filter((r) => selected.has(r.id)),
    [recipients, selected]
  );

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(recipients.map((r) => r.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function personalizeWa(name: string) {
    const [ad = "", ...rest] = name.trim().split(/\s+/);
    const soyad = rest.join(" ");
    return waMessage
      .replace(/\{ad\}/gi, ad)
      .replace(/\{soyad\}/gi, soyad)
      .replace(/Sayın üyemiz/i, ad ? `Sayın ${ad} ${soyad}`.trim() : "Sayın üyemiz");
  }

  function openWhatsAppForSelected() {
    const withPhone = selectedRecipients.filter((r) => buildWhatsAppUrl(r.phone, "x"));
    if (!withPhone.length) {
      toast.error("Seçili üyelerde geçerli telefon yok");
      return;
    }
    if (!waMessage.trim()) {
      toast.error("Mesaj yazın");
      return;
    }
    // Tarayıcı çoklu popup engelini aşmak için sırayla aç; tek üyede doğrudan aç
    if (withPhone.length === 1) {
      const r = withPhone[0];
      if (!openWhatsAppChat(r.phone, personalizeWa(r.name))) {
        toast.error("WhatsApp açılamadı");
      }
      return;
    }
    let opened = 0;
    for (const r of withPhone) {
      if (openWhatsAppChat(r.phone, personalizeWa(r.name))) opened += 1;
    }
    toast.success(
      `${opened} üye için WhatsApp açıldı. Tarayıcı engellediyse her satırdaki bağlantıyı kullanın.`
    );
  }

  return (
    <div>
      <PageHeader title="Bildirimler" desc="E-posta ve WhatsApp ile üye bilgilendirme" />

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Card className="!p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <HiOutlineMail className="h-5 w-5 text-brand-600" /> E-posta
          </div>
          <p className="mt-1 text-xs text-muted">
            {status?.mail.mock
              ? "Mock mod (SMTP yok — konsola yazılır)"
              : status?.mail.enabled
                ? `Aktif · ${status.mail.from || "SMTP"}`
                : "Kapalı"}
          </p>
        </Card>
        <Card className="!p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FaWhatsapp className="h-5 w-5 text-[#25D366]" /> WhatsApp
          </div>
          <p className="mt-1 text-xs text-muted">
            Tıkla-Gönder (wa.me) — mesaj cihazınızdaki WhatsApp ile açılır
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["send", "Toplu e-posta"],
          ["whatsapp", "WhatsApp"],
          ["dues", "Aidat hatırlatma"],
          ["event", "Etkinlik bildirimi"],
          ["logs", "Geçmiş"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as typeof tab)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              tab === id ? "bg-brand-600 text-white" : "bg-white text-slate-600 border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab !== "logs" && (
        <Card className="mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Üye filtresi" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Aktif üyeler</option>
              <option value="unpaid_dues">Ödenmemiş aidatı olanlar</option>
              <option value="with_email">E-postası olanlar</option>
              <option value="with_phone">Telefonu olanlar</option>
            </Select>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Ara</span>
              <div className="relative">
                <HiOutlineSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500"
                  placeholder="Ad, telefon..."
                />
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" className="text-sm font-semibold text-brand-700" onClick={toggleAll}>
              {allSelected ? "Seçimi kaldır" : "Tümünü seç"}
            </button>
            <span className="text-xs text-muted">{selected.size} seçili</span>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted">Yükleniyor...</p>
          ) : recipients.length === 0 ? (
            <Empty text="Üye bulunamadı" />
          ) : (
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
              {recipients.map((r) => (
                <label
                  key={r.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#1976d2]"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.name}</div>
                    <div className="truncate text-xs text-muted">
                      {[r.phone, r.email].filter(Boolean).join(" · ") || "İletişim yok"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "send" && (
        <Card className="space-y-3">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Konu (e-posta)</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand-500"
            />
          </label>
          <Textarea
            label="Mesaj"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Sayın {ad} {soyad}, ..."
          />
          <p className="text-xs text-muted">Değişkenler: {"{ad} {soyad}"}</p>
          <Button
            disabled={send.isPending || selected.size === 0}
            onClick={() => send.mutate()}
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
            {send.isPending ? "Gönderiliyor..." : "E-posta Gönder"}
          </Button>
        </Card>
      )}

      {tab === "whatsapp" && (
        <Card className="space-y-3">
          <Textarea
            label="WhatsApp mesajı"
            value={waMessage}
            onChange={(e) => setWaMessage(e.target.value)}
            placeholder={DEFAULT_WHATSAPP_TEMPLATE}
          />
          <p className="text-xs text-muted">
            Mesaj cihazınızdaki WhatsApp ile açılır (Click-to-Chat). Değişkenler: {"{ad} {soyad}"}
          </p>
          <Button
            disabled={selected.size === 0 || !waMessage.trim()}
            onClick={openWhatsAppForSelected}
            className="!bg-[#25D366] hover:!bg-[#1da851]"
          >
            <FaWhatsapp className="h-4 w-4" />
            WhatsApp ile Bilgilendir
          </Button>
          {selectedRecipients.length > 1 && (
            <div className="space-y-1 rounded-xl border border-border p-2">
              <p className="px-1 text-xs font-semibold text-muted">Tek tek aç</p>
              {selectedRecipients.map((r) => {
                const url = buildWhatsAppUrl(r.phone, personalizeWa(r.name));
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{r.name}</div>
                      <div className="truncate text-xs text-muted">{r.phone || "Telefon yok"}</div>
                    </div>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-sm font-semibold text-[#25D366]"
                      >
                        Aç
                      </a>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {tab === "dues" && (
        <Card className="space-y-3">
          <Textarea
            label="Aidat mesajı (opsiyonel)"
            value={duesBody}
            onChange={(e) => setDuesBody(e.target.value)}
            placeholder={status?.templates.dues_reminder}
          />
          <p className="text-xs text-muted">
            Değişkenler: {"{ad} {soyad} {ay} {tutar} {son_ödeme} {durum}"} — üye seçmezseniz ödenmemiş aidatı olanlara e-posta gider.
          </p>
          <Button disabled={sendDues.isPending} onClick={() => sendDues.mutate()}>
            <HiOutlinePaperAirplane className="h-4 w-4" />
            {sendDues.isPending ? "Gönderiliyor..." : "Aidat hatırlatması gönder"}
          </Button>
        </Card>
      )}

      {tab === "event" && (
        <Card className="space-y-3">
          <Select label="Etkinlik" value={eventId} onChange={(e) => setEventId(e.target.value)} required>
            <option value="">Seçin</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} {e.date ? `· ${e.date}` : ""}
              </option>
            ))}
          </Select>
          <Textarea
            label="Etkinlik mesajı (opsiyonel)"
            value={eventBody}
            onChange={(e) => setEventBody(e.target.value)}
            placeholder={status?.templates.event_notice}
          />
          <p className="text-xs text-muted">
            Değişkenler: {"{ad} {soyad} {başlık} {tarih} {saat} {konum}"} — üye seçmezseniz tüm aktif üyelere e-posta gider.
          </p>
          <Button
            disabled={sendEvent.isPending || !eventId}
            onClick={() => sendEvent.mutate()}
          >
            <HiOutlinePaperAirplane className="h-4 w-4" />
            {sendEvent.isPending ? "Gönderiliyor..." : "Etkinlik bildirimi gönder"}
          </Button>
        </Card>
      )}

      {tab === "logs" && (
        <div className="space-y-2">
          {logs.length === 0 ? (
            <Empty text="Henüz bildirim yok" />
          ) : (
            logs.map((l) => (
              <Card key={l.id} className="!p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold">
                      {l.memberName || "—"} · {l.channel.toUpperCase()}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {l.to || "Alıcı yok"} · {new Date(l.createdAt).toLocaleString("tr-TR")}
                    </div>
                    <div className="mt-1 text-sm text-slate-700 line-clamp-2">{l.body}</div>
                    {l.error && <div className="mt-1 text-xs text-red-600">{l.error}</div>}
                  </div>
                  <Badge tone={statusTone(l.status === "sent" ? "odendi" : l.status === "failed" ? "odenmedi" : "bekliyor")}>
                    {l.status === "sent" ? "Gönderildi" : l.status === "failed" ? "Hata" : "Atlandı"}
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

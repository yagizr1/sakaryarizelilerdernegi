const TOKEN_KEY = "dernek_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Sunucuya bağlanılamadı. Docker/API çalışıyor mu?");
  }

  const data = await res.json().catch(() => ({} as { message?: string }));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { message?: string }).message ||
        (res.status >= 500 ? "Sunucu hatası. Lütfen tekrar deneyin." : "Bir hata oluştu")
    );
  }
  return data as T;
}

/** Dosya indirme (blob) */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { headers });
  } catch {
    throw new ApiError(0, "Sunucuya bağlanılamadı. Docker/API çalışıyor mu?");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({} as { message?: string }));
    throw new ApiError(res.status, data.message || "İndirme başarısız");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "belge";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

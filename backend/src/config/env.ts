import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT) || 4100,
  JWT_SECRET: process.env.JWT_SECRET || "dernek-dev-secret",
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",

  MAIL_ENABLED: process.env.MAIL_ENABLED === "true",
  MAIL_FROM: process.env.MAIL_FROM || "",
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || "Dernek Yönetim",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 465,
  SMTP_SECURE: process.env.SMTP_SECURE !== "false",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",

  SMS_ENABLED: process.env.SMS_ENABLED === "true",
  SMS_PROVIDER: (process.env.SMS_PROVIDER || "mock") as "mock" | "netgsm",
  NETGSM_USERCODE: process.env.NETGSM_USERCODE || "",
  NETGSM_PASSWORD: process.env.NETGSM_PASSWORD || "",
  NETGSM_HEADER: process.env.NETGSM_HEADER || "",
};

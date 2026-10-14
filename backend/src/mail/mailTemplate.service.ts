import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { env } from "../config/env";

export type MailTemplateName = "notification-reminder";

const compiled = new Map<string, HandlebarsTemplateDelegate>();

function resolveTemplatesDir(): string {
  const candidates = [
    path.join(__dirname, "templates"),
    path.join(process.cwd(), "src/mail/templates"),
    path.join(process.cwd(), "dist/mail/templates"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "layout.hbs"))) return dir;
  }
  throw new Error("Mail templates directory not found");
}

function compileTemplate(name: string): HandlebarsTemplateDelegate {
  const cached = compiled.get(name);
  if (cached) return cached;
  const source = fs.readFileSync(path.join(resolveTemplatesDir(), `${name}.hbs`), "utf-8");
  const template = Handlebars.compile(source);
  compiled.set(name, template);
  return template;
}

export function renderMailTemplate(
  name: MailTemplateName,
  data: Record<string, unknown>
): { html: string; text: string } {
  const context = {
    brandName: env.MAIL_FROM_NAME || "Dernek Yönetim",
    year: new Date().getFullYear(),
    ...data,
  };
  const contentHtml = compileTemplate(name)(context);
  const html = compileTemplate("layout")({ ...context, body: contentHtml });
  const text = compileTemplate(`${name}.text`)(context);
  return { html, text };
}

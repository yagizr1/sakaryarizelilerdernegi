import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import membersRoutes from "./routes/members";
import duesRoutes from "./routes/dues";
import eventsRoutes from "./routes/events";
import announcementsRoutes from "./routes/announcements";
import financeRoutes from "./routes/finance";
import settingsRoutes from "./routes/settings";
import dashboardRoutes from "./routes/dashboard";
import notificationsRoutes from "./routes/notifications";
import reportsRoutes from "./routes/reports";
import applicationsRoutes from "./routes/applications";
import memberPortalRoutes from "./routes/memberPortal";
import documentsRoutes from "./routes/documents";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/dues", duesRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/member", memberPortalRoutes);
app.use("/api/documents", documentsRoutes);

app.use((_req, res) => res.status(404).json({ message: "Endpoint bulunamadı" }));

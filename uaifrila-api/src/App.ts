import express from "express";
import cors from "cors";
import routes from "./routes";
import { authMiddleware } from "./middlewares/authMiddleware";

const app = express();

app.use(express.json());
app.use(cors({
  origin: (process.env.CORS_ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
  credentials: true,
}));

// 1. ROTA PUBLICA - ANTES DE QUALQUER AUTH
// O Railway e o worker precisam conseguir chamar isso sem token.
app.get("/api/health", (_req, res) => {
  return res.json({ success: true, status: "ok" });
});

// 2. So depois vem o auth + resto das rotas
app.use("/api", authMiddleware);
app.use("/api", routes);

export default app;

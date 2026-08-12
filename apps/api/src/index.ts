import express from "express";
import cors from "cors";
import axios from "axios";
import { PrismaClient } from "@repo/db";

const app = express();
const port = process.env.PORT || 3001;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ReplayOps API is running!");
});

app.post("/api/ingest", async (req, res) => {
  try {
    const {
      projectId,
      fingerprint,
      message,
      method,
      route,
      payload,
      headers,
      queryParams,
      status,
      responseTime,
      stackTrace,
      context,
    } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }
    const apiKey = authHeader.split(" ")[1];

    const project = await prisma.project.findUnique({
      where: { apiKey },
    });

    if (!project) {
      return res.status(401).json({ error: "Invalid API Key" });
    }

    // Usar o projectId do projeto autenticado e não o do body para maior segurança
    const authenticatedProjectId = project.id;

    // Use Upsert to prevent race conditions (concurrency bug)
    const errorGroup = await prisma.errorGroup.upsert({
      where: {
        projectId_fingerprint: {
          projectId: authenticatedProjectId,
          fingerprint,
        },
      },
      update: {
        // Atualiza a data de updatedAt automaticamente
      },
      create: {
        projectId: authenticatedProjectId,
        fingerprint,
        message,
        method,
        route,
      },
    });

    // Create Event
    await prisma.event.create({
      data: {
        errorGroupId: errorGroup.id,
        payload: payload ? JSON.stringify(payload) : null,
        headers: headers ? JSON.stringify(headers) : null,
        queryParams: queryParams ? JSON.stringify(queryParams) : null,
        status,
        responseTime,
        stackTrace,
        context: context ? JSON.stringify(context) : null,
      },
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("[ReplayOps API] Error ingesting event:", error);
    res.status(500).json({ error: "Failed to ingest event" });
  }
});

app.post("/api/replay", async (req, res) => {
  try {
    const { method, url, headers, data } = req.body;
    
    // SSRF Protection: Ensure target is a valid URL and only hits allowed local hosts
    try {
      const targetUrl = new URL(url);
      if (targetUrl.hostname !== "localhost" && targetUrl.hostname !== "127.0.0.1") {
        return res.status(403).json({ error: "SSRF Protection: Replay target must be localhost or 127.0.0.1" });
      }
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL provided for replay" });
    }
    const response = await axios({
      method,
      url,
      headers: {
        ...headers,
        "x-replayops-proxy": "true"
      },
      data
    });
    
    res.json({
      status: response.status,
      headers: response.headers,
      data: response.data
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      status: error.response?.status,
      headers: error.response?.headers,
      data: error.response?.data || error.message
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}

export default app;

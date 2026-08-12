import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { sanitize, DEFAULT_SENSITIVE_KEYS } from "./sanitizer";
import { generateFingerprint } from "./fingerprint";

export interface ReplayOpsOptions {
  apiKey: string;
  projectId: string;
  apiUrl?: string;
  sensitiveKeys?: string[];
}

export function replayOpsMiddleware(options: ReplayOpsOptions) {
  const {
    apiKey,
    projectId,
    apiUrl = "http://localhost:3001/api/ingest",
    sensitiveKeys = DEFAULT_SENSITIVE_KEYS,
  } = options;

  return (err: any, req: Request, res: Response, next: NextFunction) => {
    const startTime = (req as any)._startTime || Date.now();
    const responseTime = Date.now() - startTime;

    const method = req.method;
    const route = req.path;
    const stackTrace = err.stack || err.message || "Unknown error";

    const fingerprint = generateFingerprint(method, route, stackTrace);

    const eventPayload = {
      projectId,
      fingerprint,
      message: err.message || "Internal Server Error",
      method,
      route,
      payload: sanitize(req.body, sensitiveKeys),
      headers: sanitize(req.headers, sensitiveKeys),
      queryParams: sanitize(req.query, sensitiveKeys),
      status: err.status || 500,
      responseTime,
      stackTrace,
      context: {
        url: req.url,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    };

    // Envio assíncrono para não bloquear a resposta para o usuário
    axios
      .post(apiUrl, eventPayload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .catch((e) => {
        console.error("[ReplayOps SDK] Falha ao enviar erro para a plataforma", e.message);
      });

    next(err);
  };
}

// Utilitário para marcar o início da requisição (para medir tempo de resposta corretamente)
export function replayOpsInit() {
  return (req: Request, res: Response, next: NextFunction) => {
    (req as any)._startTime = Date.now();
    next();
  };
}

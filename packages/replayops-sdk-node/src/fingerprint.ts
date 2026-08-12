import crypto from "crypto";

export function generateFingerprint(
  method: string,
  route: string,
  stackTrace?: string
): string {
  let stackHash = "";
  
  if (stackTrace) {
    // Pega as duas primeiras linhas do stack trace para evitar que mudanças na stack criem novos grupos para o mesmo erro
    const lines = stackTrace.split("\n").slice(1, 3).join("");
    stackHash = lines;
  }

  const raw = `${method}:${route}:${stackHash}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

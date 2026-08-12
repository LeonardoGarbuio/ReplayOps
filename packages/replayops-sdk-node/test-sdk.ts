import express from "express";
import { replayOpsInit, replayOpsMiddleware } from "./src";

const app = express();
app.use(express.json());

// 1. O middleware de init tem que vir antes das rotas para marcar o _startTime
app.use(replayOpsInit());

// 2. Rotas normais
app.get("/", (req, res) => {
  res.send("Tudo ok por aqui!");
});

// 3. Rota que simula um erro
app.post("/test-error", (req, res) => {
  console.log("Recebi dados:", req.body);
  
  // Forçando um erro!
  throw new Error("Erro catastrófico no sistema hahaha!");
});

// 4. O middleware de erro do SDK SEMPRE vem por último, depois de todas as rotas
app.use(
  replayOpsMiddleware({
    apiKey: "minha-chave-de-teste",
    projectId: "projeto-123",
    // apiUrl: se quiser, coloque a URL da sua API local aqui (o padrão já é localhost:3001/api/ingest)
  })
);

app.listen(3002, () => {
  console.log("Servidor de teste rodando na porta 3002! 🚀");
  console.log("Faça um POST para http://localhost:3002/test-error para testar o SDK.");
});

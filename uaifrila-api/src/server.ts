import dotenv from 'dotenv';
dotenv.config();

import { App } from './App';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const appInstance = new App();
appInstance.expressApp.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] UaiFrila API rodando em http://0.0.0.0:${PORT}`);
  console.log(`[SERVER] Timezone DB: UTC`);
  console.log(`[SERVER] Endpoints:`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/vagas/criar`);
  console.log(`  GET  /api/vagas/minhas`);
  console.log(`  GET  /api/vagas/minhas-publicadas`);
  console.log(`  GET  /api/vagas/mural`);
  console.log(`  GET  /api/endereco-vaga`);
});

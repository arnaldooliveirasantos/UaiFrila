import dotenv from 'dotenv';
import { App } from './App';

dotenv.config();

const appInstance = new App();
const port = process.env.PORT || 3000;

appInstance.expressApp.listen(port, () => {
  console.log(`🚀 UaiFrila API rodando na porta ${port} - UTC0`);
  console.log(`📍 http://localhost:${port}/api/health`);
  console.log(`📍 http://192.168.24.11:${port}/api/health`);
});

import dotenv from 'dotenv';
dotenv.config();
import { App } from './App';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const appInstance: any = new App();
const expressApp = typeof appInstance.getApp === 'function' ? appInstance.getApp() : appInstance.expressApp;
expressApp.listen(PORT, '0.0.0.0', () => { console.log(`[SERVER] UaiFrila API rodando em http://0.0.0.0:${PORT}`); });

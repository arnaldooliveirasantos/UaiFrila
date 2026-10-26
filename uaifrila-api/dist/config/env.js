"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Variável de ambiente obrigatória não definida: ${name} - configure no arquivo .env`);
    }
    return value;
}
function requireEnvNumber(name) {
    const value = requireEnv(name);
    const num = Number(value);
    if (isNaN(num)) {
        throw new Error(`Variável ${name} deve ser número válido, recebido: ${value}`);
    }
    return num;
}
exports.config = {
    DB_USER: requireEnv('DB_USER'),
    DB_PASSWORD: requireEnv('DB_PASSWORD'),
    DB_HOST: requireEnv('DB_HOST'),
    DB_PORT: requireEnvNumber('DB_PORT'),
    DB_NAME: requireEnv('DB_NAME'),
    JWT_SECRET: requireEnv('JWT_SECRET'),
    SMTP_HOST: requireEnv('SMTP_HOST'),
    SMTP_PORT: requireEnvNumber('SMTP_PORT'),
    SMTP_USER: requireEnv('SMTP_USER'),
    SMTP_PASS: requireEnv('SMTP_PASS'),
    WORKER_INTERVAL_MS: requireEnvNumber('WORKER_INTERVAL_MS'),
    WORKER_BATCH_SIZE: requireEnvNumber('WORKER_BATCH_SIZE'),
    MAX_TENTATIVAS: requireEnvNumber('MAX_TENTATIVAS'),
    PORT: requireEnvNumber('PORT'),
};

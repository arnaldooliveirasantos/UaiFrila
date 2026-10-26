"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const pg_1 = require("pg");
const env_1 = require("../config/env");
class BaseRepository {
    static pool = null;
    pool;
    constructor() {
        if (!BaseRepository.pool) {
            BaseRepository.pool = new pg_1.Pool({
                user: env_1.config.DB_USER,
                password: env_1.config.DB_PASSWORD,
                host: env_1.config.DB_HOST,
                port: env_1.config.DB_PORT,
                database: env_1.config.DB_NAME,
                max: 10
            });
        }
        this.pool = BaseRepository.pool;
    }
    async query(text, params) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    async queryOne(text, params) {
        const rows = await this.query(text, params);
        return rows[0] || null;
    }
    async execute(text, params) {
        return this.query(text, params);
    }
}
exports.BaseRepository = BaseRepository;

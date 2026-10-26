"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const pg_1 = require("pg");
class BaseRepository {
    static pool = null;
    pool;
    constructor() {
        if (!BaseRepository.pool) {
            BaseRepository.pool = new pg_1.Pool({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                host: process.env.DB_HOST,
                port: Number(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME,
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
}
exports.BaseRepository = BaseRepository;

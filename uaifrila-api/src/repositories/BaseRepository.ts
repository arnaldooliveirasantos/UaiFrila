import { Client } from 'pg';
export abstract class BaseRepository {
    protected dbClient: Client;
    constructor() {
        delete process.env.DATABASE_URL;
        this.dbClient = new Client({ user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME });
        this.dbClient.connect().catch(err => console.error(err));
    }
    protected async query(text: string, params?: any[]): Promise<any[]> {
        const res = await this.dbClient.query(text, params); return res.rows;
    }
}

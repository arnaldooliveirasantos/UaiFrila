import { Client } from 'pg';

export abstract class BaseRepository {
    protected dbClient: Client;

    constructor() {
        // Purgamento preventivo de streams de URL automáticas da biblioteca 'pg'
        delete process.env.DATABASE_URL;
        delete process.env.PGPASSWORD;
        delete process.env.PGUSER;

        // Consome estritamente as propriedades isoladas injetadas pelo dotenv no .env da API
        const user = process.env.DB_USER;
        const password = process.env.DB_PASSWORD;
        const host = process.env.DB_HOST;
        const port = Number(process.env.DB_PORT);
        const database = process.env.DB_NAME;

        this.dbClient = new Client({
            user,
            password,
            host,
            port,
            database
        });
        
        this.dbClient.connect().catch(err => {
            console.error(`❌ Falha de conexão no [\${this.constructor.name}]:`, err.message);
        });
    }

    protected async query(text: string, params?: any[]): Promise<any[]> {
        const res = await this.dbClient.query(text, params);
        return res.rows;
    }
}

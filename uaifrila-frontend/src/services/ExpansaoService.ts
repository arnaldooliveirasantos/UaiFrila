
export class ExpansaoService {
  private apiUrl: string;
  constructor() { this.apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api'; }
  async listar(): Promise<any[]> {
    const token = localStorage.getItem('uaifrila_token');
    const res = await fetch(`${this.apiUrl}/expansao`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro expansao');
    return data.cidades || data.data || [];
  }
}

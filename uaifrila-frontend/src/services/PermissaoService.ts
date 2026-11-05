
export interface RolePermissao {
  role_id: number;
  role_nome: string;
  permissoes: any[];
}
export class PermissaoService {
  private apiUrl: string;
  constructor() { this.apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api'; }
  async listarMatriz(): Promise<RolePermissao[]> {
    const token = localStorage.getItem('uaifrila_token');
    const res = await fetch(`${this.apiUrl}/permissoes/matriz`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.erro || 'Erro permissoes');
    return data.matriz || data.data || [];
  }
}

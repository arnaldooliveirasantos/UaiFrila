import { BaseService } from './BaseService';
import { ProvedorPagamentoRepository } from '../repositories/ProvedorPagamentoRepository';
import { criptografar, descriptografar } from '../utils/Criptografia';
// Provedor ativo: fonte única das taxas. Sem provedor ativo, nenhuma cobrança acontece.
// Segredos: salvos criptografados; descriptografados SÓ aqui, em memória, para chamar a API.
export class ProvedorPagamentoService extends BaseService<any> {
  private repo = new ProvedorPagamentoRepository();
  constructor() { super(new ProvedorPagamentoRepository()); }
  async buscarAtivo(): Promise<any> {
    const p = await this.repo.buscarAtivo();
    if (!p) throw new Error('Nenhum provedor de pagamento ativo — configure em Provedores de Pagamento (admin)');
    return p;
  }
  async buscarAtivoComSegredos(): Promise<{ provedor: any; accessToken: string; webhookSecret: string }> {
    const p: any = await this.buscarAtivo();
    const accessToken = descriptografar(p.clientSecretCriptografado || p.client_secret_criptografado || '');
    if (!accessToken) throw new Error(`Provedor ${p.provedor} sem access token configurado — cadastre o segredo no admin`);
    const webhookSecret = p.webhookSecretCriptografado || p.webhook_secret_criptografado ? descriptografar(p.webhookSecretCriptografado || p.webhook_secret_criptografado) : '';
    return { provedor: p, accessToken, webhookSecret };
  }
  async listarAdmin(): Promise<any[]> {
    const lista = await this.repo.buscarTodos();
    return lista.map((p: any) => (typeof p.toPublicAdmin === 'function' ? p.toPublicAdmin() : p));
  }
  async atualizar(adminId: number, provedor: string, dados: any): Promise<any> {
    const atual: any = await this.repo.buscarPorProvedor(provedor);
    if (!atual) throw new Error(`Provedor ${provedor} não cadastrado`);
    const patch: any = {};
    if (dados.taxa_pix_percentual !== undefined) patch.taxa_pix_percentual = Number(dados.taxa_pix_percentual);
    if (dados.taxa_cartao_percentual !== undefined) patch.taxa_cartao_percentual = Number(dados.taxa_cartao_percentual);
    if (dados.ambiente) patch.ambiente = dados.ambiente;
    if (dados.client_id !== undefined) patch.client_id = String(dados.client_id);
    if (dados.client_secret) patch.client_secret_criptografado = criptografar(String(dados.client_secret));
    if (dados.webhook_secret) patch.webhook_secret_criptografado = criptografar(String(dados.webhook_secret));
    if (dados.pix_chave_recebimento !== undefined) patch.pix_chave_recebimento = String(dados.pix_chave_recebimento);
    if (dados.config_json) patch.config_json = dados.config_json;
    const salvo = await this.repo.atualizarGenerico(Number(atual.id), patch);
    await this.repo.registrarAuditoria(Number(atual.id), adminId, 'ATUALIZAR', !!atual.ativo, !!atual.ativo);
    return salvo;
  }
  async ativar(adminId: number, provedor: string): Promise<any> {
    const alvo: any = await this.repo.buscarPorProvedor(provedor);
    if (!alvo) throw new Error(`Provedor ${provedor} não cadastrado`);
    if (!alvo.clientSecretCriptografado && !alvo.client_secret_criptografado) throw new Error(`Cadastre o access token de ${provedor} antes de ativar`);
    const anterior: any = await this.repo.buscarAtivo();
    await this.repo.desativarTodos();
    const salvo = await this.repo.atualizarGenerico(Number(alvo.id), { ativo: true });
    await this.repo.registrarAuditoria(Number(alvo.id), adminId, 'ATIVAR', !!anterior && Number(anterior.id) === Number(alvo.id), true);
    if (anterior && Number(anterior.id) !== Number(alvo.id)) await this.repo.registrarAuditoria(Number(anterior.id), adminId, 'DESATIVAR', true, false);
    return salvo;
  }
}

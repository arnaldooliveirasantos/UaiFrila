import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import ValidacaoCodigo from './ValidacaoCodigo';
import BlocoEndereco from './BlocoEndereco';
import { UsuarioService } from '../services/UsuarioService';
import { apiGetPublic } from '../utils/Api';
import { WizardIndicador, WizardNavegacao } from './WizardEtapas';
import EtapaCadastroTipo from './cadastro/EtapaCadastroTipo';
import EtapaCadastroDados from './cadastro/EtapaCadastroDados';
import EtapaCadastroEndereco from './cadastro/EtapaCadastroEndereco';
import EtapaCadastroTermosRevisao from './cadastro/EtapaCadastroTermosRevisao';

// ORQUESTRADOR do cadastro: guarda TODO o estado, valida cada etapa e so
// envia na ultima (POST /api/auth/solicitar-codigo). As etapas sao arquivos
// separados em ./cadastro/ e so recebem props - nenhuma etapa salva sozinha.
// O INSERT do usuario + endereco continua acontecendo so no validar-codigo.
export default function CadastroUnificado({ onCadastro, usuario: usuarioProp, modoEdicao = false }: any) {
  const styles = useUaiFrilaStyles();
  const [queroTrampar, setQueroTrampar] = useState(true);
  const [queroContratar, setQueroContratar] = useState(false);
  const [form, setForm] = useState<any>({ nome: '', cpf: '', email: '', cnpj: '', nomeFantasia: '', funcao: 'Garçom', valorHora: 20, bio: '', bairro: 'Centro', endereco: '', cidade_id: 1, cep: '', numero: '', complemento: '', lat: undefined, lng: undefined, termos: [false, false, false, false, false], temMei: false });
  const [cidades, setCidades] = useState<any[]>([]);
  const [etapa, setEtapa] = useState<'form' | 'codigo'>('form');
  const [passo, setPasso] = useState(0);
  const PASSOS_CADASTRO = ['Como você vai usar', 'Seus dados', 'Endereço', 'Termos e revisão'];
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const getTipoChave = () => UsuarioService.getTipoChave(queroTrampar, queroContratar);
  const tipoAtual = (usuarioProp?.tipo_chave || '').toUpperCase();
  const isTipoRestrito = modoEdicao && tipoAtual && !UsuarioService.isTipoEditavel(tipoAtual);
  const isReadOnly = !!isTipoRestrito;
  const travaTrampar = modoEdicao && tipoAtual !== 'CONTRATANTE';
  const travaContratar = modoEdicao && tipoAtual !== 'FREELA';
  useEffect(() => {
    const tipo = localStorage.getItem('uaifrila_tipo_cadastro');
    if (tipo) { const checks = UsuarioService.parseTipoParaChecks(tipo); setQueroTrampar(checks.trampar); setQueroContratar(checks.contratar); }
    apiGetPublic('/api/cidades').then((d: any) => setCidades(d.cidades || d.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    if (modoEdicao && usuarioProp) {
      const checks = UsuarioService.parseTipoParaChecks(usuarioProp.tipo_chave || 'FREELA');
      if (!['FREELA', 'CONTRATANTE', 'DUAL'].includes((usuarioProp.tipo_chave || '').toUpperCase())) { checks.trampar = true; checks.contratar = true; }
      setQueroTrampar(checks.trampar); setQueroContratar(checks.contratar);
      const end = (usuarioProp as any).endereco_ativo
        || (Array.isArray((usuarioProp as any).enderecos_usuarios) ? (usuarioProp as any).enderecos_usuarios.find((e: any) => e.ativo) || (usuarioProp as any).enderecos_usuarios[0] : null)
        || (Array.isArray((usuarioProp as any).enderecos) ? (usuarioProp as any).enderecos.find((e: any) => e.ativo) || (usuarioProp as any).enderecos[0] : null)
        || null;
      setForm({
        nome: usuarioProp.nome_completo || '', cpf: (usuarioProp.cpf || '').replace(/\D/g, ''), email: usuarioProp.email || '',
        cnpj: (usuarioProp.cnpj || '').replace(/\D/g, ''), nomeFantasia: usuarioProp.nome_fantasia || '',
        funcao: usuarioProp.funcao_principal || 'Garçom', valorHora: usuarioProp.valor_hora_base || 20, bio: usuarioProp.bio || '',
        bairro: end?.bairro, endereco: end?.logradouro, cidade_id: end?.cidade_id, estado_id: (end as any)?.cidade?.estadoId,
        cep: end?.cep, numero: end?.numero, complemento: end?.complemento, lat: end?.latitude, lng: end?.longitude,
        termos: [true, true, true, true, true], temMei: usuarioProp.tem_mei || false,
      });
    }
  }, [modoEdicao, usuarioProp]);
  const montarDadosCadastro = () => ({
    nome: form.nome, nome_completo: form.nome,
    cpf: String(form.cpf || '').replace(/\D/g, ''), cnpj: form.cnpj || null,
    email: String(form.email || '').trim().toLowerCase(),
    nomeFantasia: form.nomeFantasia || null, nome_fantasia: form.nomeFantasia || null,
    funcao: form.funcao, funcao_principal: form.funcao, valorHora: form.valorHora, valor_hora_base: form.valorHora,
    bio: form.bio || null, tipo_chave: getTipoChave(), tipoChave: getTipoChave(), temMei: !!form.temMei, tem_mei: !!form.temMei,
    endereco: { logradouro: form.endereco, endereco: form.endereco, bairro: form.bairro, cep: form.cep, numero: form.numero, complemento: form.complemento, cidade_id: form.cidade_id, cidadeId: form.cidade_id, lat: form.lat, lng: form.lng },
    bairro: form.bairro, cep: form.cep, numero: form.numero, complemento: form.complemento, cidade_id: form.cidade_id, lat: form.lat, lng: form.lng,
  });
  const validarPasso = (n: number): string | null => {
    if (n === 0) { if (!queroTrampar && !queroContratar) return 'Escolha Trampar ou Contratar'; return null; }
    if (n === 1) {
      if (!form.nome || !form.cpf || !form.email) return 'Preencha nome, CPF, email';
      if (String(form.cpf || '').replace(/\D/g, '').length !== 11) return 'CPF deve ter 11 dígitos';
      if (form.cnpj && String(form.cnpj).replace(/\D/g, '').length !== 14) return 'CNPJ deve ter 14 dígitos';
      return null;
    }
    if (n === 2) { if (!form.endereco?.trim() || !form.cep?.trim()) return 'Preencha endereço e CEP'; return null; }
    return null;
  };
  const avancarPasso = () => { const e = validarPasso(passo); if (e) { setErro(e); return; } setErro(''); setPasso((s) => Math.min(s + 1, 3)); };
  const voltarPasso = () => { setErro(''); setPasso((s) => Math.max(s - 1, 0)); };
  const handleSubmit = async () => {
    if (isReadOnly) { setErro(`Tipo ${tipoAtual} só visualização`); return; }
    { const e0 = validarPasso(0) || validarPasso(1) || validarPasso(2); if (e0) { setErro(e0); return; } }
    if (!form.endereco?.trim() || !form.cep?.trim()) { setErro('Preencha endereço e CEP'); return; }
    const dadosCadastro = montarDadosCadastro();
    setCarregando(true);
    try {
      await apiGetPublic('/api/auth/solicitar-codigo', { method: 'POST', body: JSON.stringify({ email: dadosCadastro.email, tipo: 'cadastro', dadosCadastro }) });
      try { localStorage.setItem('uaifrila_cadastro_pendente', JSON.stringify(dadosCadastro)); } catch {}
      setEtapa('codigo');
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  if (etapa === 'codigo') return <ValidacaoCodigo email={form.email} tipo="cadastro" dadosCadastro={montarDadosCadastro()} onValidado={() => onCadastro?.(form.email)} onVoltar={() => setEtapa('form')} />;
  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>{modoEdicao ? 'Meu Perfil' : 'Cadastro'}</h2>
        <WizardIndicador etapas={PASSOS_CADASTRO} etapa={passo} />
        {isReadOnly && <div className="mt-4 p-4 bg-yellow-300 border-4 border-black font-black text-xs">🔒 Tipo {tipoAtual} só visualização - editáveis: FREELA, CONTRATANTE, DUAL</div>}
        {passo === 0 && <EtapaCadastroTipo queroTrampar={queroTrampar} setQueroTrampar={setQueroTrampar} queroContratar={queroContratar} setQueroContratar={setQueroContratar} isReadOnly={isReadOnly} travaTrampar={travaTrampar} travaContratar={travaContratar} getTipoChave={getTipoChave} />}
        {passo === 1 && <EtapaCadastroDados form={form} setForm={setForm} isReadOnly={isReadOnly} modoEdicao={modoEdicao} />}
        {passo === 2 && <EtapaCadastroEndereco form={form} setForm={setForm} cidades={cidades} isReadOnly={isReadOnly} modoEdicao={modoEdicao} />}
        {passo === 3 && <EtapaCadastroTermosRevisao form={form} setForm={setForm} isReadOnly={isReadOnly} getTipoChave={getTipoChave} />}
        {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
        <WizardNavegacao etapas={PASSOS_CADASTRO} etapa={passo} onVoltar={voltarPasso} onAvancar={avancarPasso} onFinalizar={handleSubmit} finalizarLabel={carregando ? 'Enviando...' : modoEdicao ? 'Salvar perfil' : `Cadastrar como ${getTipoChave()}`} carregando={carregando} podeFinalizar={!isReadOnly} />
      </div>
      {modoEdicao && (
        <div className={styles.card + ' mt-4'}>
          <h2 className={styles.typography.h1}>Meus endereços</h2>
          <p className={styles.typography.caption + ' mt-1'}>Cadastre um novo, troque o ativo ou edite o endereço ativo. A alteração vale na hora e o endereço do perfil acima acompanha.</p>
          <div className="mt-4"><BlocoEndereco onEnderecoChange={(end: any) => {
            if (!end) return;
            setForm((f: any) => ({ ...f, endereco: end.logradouro, bairro: end.bairro, cep: end.cep, numero: end.numero, complemento: end.complemento, cidade_id: end.cidade_id, estado_id: end?.cidade?.estadoId, lat: end.latitude, lng: end.longitude }));
          }} /></div>
        </div>
      )}
    </div>
  );
}

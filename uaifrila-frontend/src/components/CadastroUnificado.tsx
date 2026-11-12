
import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import ValidacaoCodigo from './ValidacaoCodigo';
import BlocoEndereco from './BlocoEndereco';
import { UsuarioService } from '../services/UsuarioService';
import { apiGetPublic } from '../utils/Api';
import { formatarCPF, formatarCNPJ } from '../utils/mascaras';

export default function CadastroUnificado({ onCadastro, usuario: usuarioProp, modoEdicao = false }: any) {
  const styles = useUaiFrilaStyles();
  const [queroTrampar, setQueroTrampar] = useState(true);
  const [queroContratar, setQueroContratar] = useState(false);
  const [form, setForm] = useState<any>({ nome: '', cpf: '', email: '', cnpj: '', nomeFantasia: '', funcao: 'Garçom', valorHora: 20, bio: '', bairro: 'Centro', endereco: '', cidade_id: 1, cep: '', numero: '', complemento: '', lat: undefined, lng: undefined, termos: [false,false,false,false,false], temMei: false });
  const [cidades, setCidades] = useState<any[]>([]);
  const [etapa, setEtapa] = useState<'form'|'codigo'>('form');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const API = (import.meta as any).env?.VITE_API_URL;

  const getTipoChave = () => UsuarioService.getTipoChave(queroTrampar, queroContratar);
  const tipoAtual = (usuarioProp?.tipo_chave||'').toUpperCase();
  const isTipoRestrito = modoEdicao && tipoAtual && !UsuarioService.isTipoEditavel(tipoAtual);
  const isReadOnly = !!isTipoRestrito;

  // Travas de tipo no Perfil — pelo TIPO LOGADO (usuarioProp.tipo_chave):
  // FREELA: Trampar travado ligado, Contratar livre (ligar -> vira DUAL)
  // CONTRATANTE: Trampar livre (ligar -> vira DUAL), Contratar travado ligado
  // DUAL: os dois travados ligados
  // Outros tipos: os dois travados ligados
  const travaTrampar = modoEdicao && tipoAtual !== 'CONTRATANTE';
  const travaContratar = modoEdicao && tipoAtual !== 'FREELA';

  useEffect(()=>{
    const tipo = localStorage.getItem('uaifrila_tipo_cadastro');
    if (tipo) {
      const checks = UsuarioService.parseTipoParaChecks(tipo);
      setQueroTrampar(checks.trampar);
      setQueroContratar(checks.contratar);
    }
    // /api/cidades ja devolve SO ativas (a rota /api/cidades/ativas nao existia e caia no /:id). A lista serve p/ o select e p/ resolver o estado pela cidade.
    fetch(`${API}/api/cidades`).then(r=>r.json()).then(d=>setCidades(d.cidades||d.data||[])).catch(()=>{});
  }, []);

  useEffect(()=>{
    if (modoEdicao && usuarioProp) {
      const checks = UsuarioService.parseTipoParaChecks(usuarioProp.tipo_chave||'FREELA');
      // Outros tipos: os dois travados ligados (ex.: ADMIN nao e nem FREELA nem CONTRATANTE).
      if (!['FREELA', 'CONTRATANTE', 'DUAL'].includes((usuarioProp.tipo_chave || '').toUpperCase())) { checks.trampar = true; checks.contratar = true; }
      setQueroTrampar(checks.trampar);
      setQueroContratar(checks.contratar);
      // BUG 1 - endereço não carregava no Perfil:
      // ANTES: lia só usuarioProp.endereco_ativo_bairro / _completo / _cep (campos planos).
      // O /auth/me devolve endereco_ativo (OBJETO) + enderecos_usuarios (LISTA), não os campos planos.
      // Resultado: bairro voltava 'Centro', endereço vazio, CEP vazio - mesmo com endereço no banco.
      // AGORA: usa o objeto endereco_ativo primeiro, depois o 1º de enderecos_usuarios, depois os campos planos.
      // Aceita os 2 nomes de coluna: logradouro/endereco, cidade_id/cidadeId, latitude/longitude/lat/lng.
      const end = (usuarioProp as any).endereco_ativo
        || (Array.isArray((usuarioProp as any).enderecos_usuarios) ? (usuarioProp as any).enderecos_usuarios.find((e: any) => e.ativo) || (usuarioProp as any).enderecos_usuarios[0] : null)
        || (Array.isArray((usuarioProp as any).enderecos) ? (usuarioProp as any).enderecos.find((e: any) => e.ativo) || (usuarioProp as any).enderecos[0] : null)
        || null;
      const completo = end ? [end.logradouro || end.endereco || '', end.numero || ''].join(' ').trim() : '';
      setForm({
        nome: usuarioProp.nome_completo||'', cpf: (usuarioProp.cpf||'').replace(/\D/g,''), email: usuarioProp.email||'',
        cnpj: (usuarioProp.cnpj||'').replace(/\D/g,''), nomeFantasia: usuarioProp.nome_fantasia||'',
        funcao: usuarioProp.funcao_principal||'Garçom', valorHora: usuarioProp.valor_hora_base||20, bio: usuarioProp.bio||'',
        // Campos de endereco: caminho unico a partir de `end` (linha do /auth/me).
        // Estado: CAMINHO UNICO — end.cidade.estadoId (o /auth/me devolve o cidade
        // aninhado). Sem fallback, sem cadeia de alternativas.
        bairro: end?.bairro,
        endereco: end?.logradouro,
        cidade_id: end?.cidade_id,
        estado_id: (end as any)?.cidade?.estadoId,
        cep: end?.cep,
        numero: end?.numero,
        complemento: end?.complemento,
        lat: end?.latitude, lng: end?.longitude,
        termos: [true,true,true,true,true], temMei: usuarioProp.tem_mei||false
      });
      if (end) console.log('[CadastroUnificado] endereço carregado do /auth/me:', { completo, bairro: end.bairro, cep: end.cep, cidade_id: end.cidade_id });
      else console.warn('[CadastroUnificado] sem endereço em endereco_ativo/enderecos_usuarios - campos ficam vazios');
    }
  }, [modoEdicao, usuarioProp]);

  // ÚNICA cirurgia de lógica: monta dadosCadastro UMA vez e leva até o validar.
  // Antes: POST /auth/cadastro (rota NÃO existe -> 404) e NUNCA enviava dados para o validar.
  // Agora: POST /api/auth/solicitar-codigo { email, tipo:'cadastro', dadosCadastro } + salva em localStorage.
  // O INSERT de usuario só acontece no validar-codigo, e só se ele receber dadosCadastro.
  const montarDadosCadastro = () => ({
    nome: form.nome, nome_completo: form.nome,
    cpf: String(form.cpf || '').replace(/\D/g, ''), cnpj: form.cnpj || null,
    email: String(form.email || '').trim().toLowerCase(),
    nomeFantasia: form.nomeFantasia || null, nome_fantasia: form.nomeFantasia || null,
    funcao: form.funcao, funcao_principal: form.funcao, valorHora: form.valorHora, valor_hora_base: form.valorHora,
    bio: form.bio || null, tipo_chave: getTipoChave(), tipoChave: getTipoChave(), temMei: !!form.temMei, tem_mei: !!form.temMei,
    // Termos: NÃO vão para o banco. Ao concluir o cadastro, considera-se que o usuário aceitou todos.
    // As caixas abaixo são só leitura/informação - não bloqueiam e não são enviadas.
    endereco: { logradouro: form.endereco, endereco: form.endereco, bairro: form.bairro, cep: form.cep, numero: form.numero, complemento: form.complemento, cidade_id: form.cidade_id, cidadeId: form.cidade_id, lat: form.lat, lng: form.lng },
    bairro: form.bairro, cep: form.cep, numero: form.numero, complemento: form.complemento, cidade_id: form.cidade_id, lat: form.lat, lng: form.lng,
  });
  const handleSubmit = async () => {
    if (isReadOnly) { setErro(`Tipo ${tipoAtual} só visualização`); return; }
    if (!form.nome || !form.cpf || !form.email) { setErro('Preencha nome, CPF, email'); return; }
    if (String(form.cpf || '').replace(/\D/g, '').length !== 11) { setErro('CPF deve ter 11 dígitos'); return; }
    if (!queroTrampar && !queroContratar) { setErro('Escolha Trampar ou Contratar'); return; }
    // Termos: NÃO bloqueiam. Concluir o cadastro = aceitar todos (regra do usuário).
    if (!form.endereco?.trim() || !form.cep?.trim()) { setErro('Preencha endereço e CEP'); return; }
    const dadosCadastro = montarDadosCadastro();
    setCarregando(true);
    try {
      await apiGetPublic('/api/auth/solicitar-codigo', { method: 'POST', body: JSON.stringify({ email: dadosCadastro.email, tipo: 'cadastro', dadosCadastro }) });
      try { localStorage.setItem('uaifrila_cadastro_pendente', JSON.stringify(dadosCadastro)); } catch {}
      setEtapa('codigo');
    } catch (e:any) { setErro(e.message); } finally { setCarregando(false); }
  };

  if (etapa==='codigo') return <ValidacaoCodigo email={form.email} tipo="cadastro" dadosCadastro={montarDadosCadastro()} onValidado={()=>onCadastro?.(form.email)} onVoltar={()=>setEtapa('form')} />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>{modoEdicao ? 'Meu Perfil' : 'Cadastro'}</h2>
        {isReadOnly && <div className="mt-4 p-4 bg-yellow-300 border-4 border-black font-black text-xs">🔒 Tipo {tipoAtual} só visualização - editáveis: FREELA, CONTRATANTE, DUAL</div>}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button disabled={isReadOnly || travaTrampar} onClick={()=>{ if (!isReadOnly && !travaTrampar) setQueroTrampar(!queroTrampar); }} className={`${queroTrampar ? styles.cardHighlight + ' p-6 flex gap-4' : styles.cardSmall + ' flex gap-4 opacity-70'} ${(isReadOnly || travaTrampar) ? 'opacity-40' : ''}`}>
            <span>💪</span><div><div className="font-black uppercase text-sm">Quero Trampar{travaTrampar ? ' 🔒' : ''}</div></div><div className="ml-auto w-6 h-6 border-2 flex items-center justify-center">{queroTrampar && '✓'}</div>
          </button>
          <button disabled={isReadOnly || travaContratar} onClick={()=>{ if (!isReadOnly && !travaContratar) setQueroContratar(!queroContratar); }} className={`${queroContratar ? 'p-6 border-4 bg-red-500 text-white border-black flex gap-4' : styles.cardSmall + ' flex gap-4 opacity-70'} ${(isReadOnly || travaContratar) ? 'opacity-40' : ''}`}>
            <span>🏢</span><div><div className="font-black uppercase text-sm">Quero Contratar{travaContratar ? ' 🔒' : ''}</div></div><div className="ml-auto w-6 h-6 border-2 flex items-center justify-center">{queroContratar && '✓'}</div>
          </button>
        </div>
        {queroTrampar && queroContratar && <div className="mt-3 text-xs p-3 bg-green-200 border-2 border-black">✨ DUAL</div>}
        <div className="text-[10px] opacity-50 mt-2">DEBUG: {getTipoChave()} trampar={queroTrampar?'sim':'nao'} contratar={queroContratar?'sim':'nao'}</div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={styles.label}>Nome</label><input value={form.nome} disabled={isReadOnly} onChange={e=>setForm({...form, nome: e.target.value})} className={styles.input} /></div>
          <div><label className={styles.label}>CPF</label><input value={formatarCPF(form.cpf || '')} disabled={isReadOnly || modoEdicao} onChange={e=>setForm({...form, cpf: e.target.value.replace(/\D/g,'').slice(0,11)})} className={styles.input + (modoEdicao ? ' opacity-60' : '')} placeholder="000.000.000-00" inputMode="numeric" maxLength={14} /></div>
          <div><label className={styles.label}>E-mail *</label><input type="email" value={form.email} disabled={isReadOnly || modoEdicao} onChange={e=>setForm({...form, email: e.target.value})} className={styles.input + (modoEdicao ? ' opacity-60' : '')} placeholder="voce@email.com" autoComplete="email" /></div>
          <div><label className={styles.label}>CNPJ (opcional)</label><input value={formatarCNPJ(form.cnpj || '')} disabled={isReadOnly} onChange={e=>setForm({...form, cnpj: e.target.value.replace(/\D/g,'').slice(0,14)})} className={styles.input} placeholder="00.000.000/0000-00" inputMode="numeric" maxLength={18} /></div>
          <div className="md:col-span-2"><BlocoEndereco form={form} setForm={setForm} cidades={cidades} titulo="ENDEREÇO" subtitulo={isReadOnly ? 'Visualização' : 'Preencha CEP'} modoCadastro={!modoEdicao} /></div>
        </div>
        <div className="mt-6 space-y-2">
          <h3 className={styles.typography.h3}>Termos de aceite (ao concluir o cadastro, considera-se que você aceitou todos)</h3>
          <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[0]} disabled={isReadOnly} onChange={e => { const termos = [...(form.termos || [false,false,false,false,false])]; termos[0] = e.target.checked; setForm({ ...form, termos }); }} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">1. Autônomo Art. 442-B CLT</span><span className={styles.typography.bodySmall + ' block'}>Sou autônomo, sem vínculo CLT. Não há horário fixo, só trampo por diária.</span></span></label>
          <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[1]} disabled={isReadOnly} onChange={e => { const termos = [...(form.termos || [false,false,false,false,false])]; termos[1] = e.target.checked; setForm({ ...form, termos }); }} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">2. LGPD</span><span className={styles.typography.bodySmall + ' block'}>Meus dados (CPF, e-mail, bairro) são usados só para conectar você ao trampo.</span></span></label>
          <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[2]} disabled={isReadOnly} onChange={e => { const termos = [...(form.termos || [false,false,false,false,false])]; termos[2] = e.target.checked; setForm({ ...form, termos }); }} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">3. MEI R$1500</span><span className={styles.typography.bodySmall + ' block'}>Limite de R$1500 por contratante por mês para não caracterizar vínculo.</span></span></label>
          <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[3]} disabled={isReadOnly} onChange={e => { const termos = [...(form.termos || [false,false,false,false,false])]; termos[3] = e.target.checked; setForm({ ...form, termos }); }} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">4. Cancelamento R$40</span><span className={styles.typography.bodySmall + ' block'}>Cancelamento em menos de 12h antes do trampo gera taxa de R$40.</span></span></label>
          <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[4]} disabled={isReadOnly} onChange={e => { const termos = [...(form.termos || [false,false,false,false,false])]; termos[4] = e.target.checked; setForm({ ...form, termos }); }} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">5. Intermediação 15%</span><span className={styles.typography.bodySmall + ' block'}>Taxa de intermediação de 15% sobre a diária. Freela recebe 85%.</span></span></label>
          <p className={styles.typography.caption}>Você pode marcar/desmarcar para ler, mas concluir o cadastro já vale como aceite de todos. Nada disso é gravado no banco.</p>
        </div>
        {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
        <button onClick={handleSubmit} disabled={carregando || isReadOnly} className={`${styles.buttonPrimary(carregando || isReadOnly)} mt-8`}>{isReadOnly ? 'Somente Visualização' : `Cadastrar como ${getTipoChave()}`}</button>
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

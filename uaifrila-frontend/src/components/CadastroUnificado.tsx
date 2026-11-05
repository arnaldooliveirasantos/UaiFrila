import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import ValidacaoCodigo from './ValidacaoCodigo';
import BlocoEndereco from './BlocoEndereco';
import { UsuarioService } from '../services/UsuarioService';
import { apiFetch, apiGetPublic } from '../utils/Api';

export default function CadastroUnificado({ onCadastro, usuario: usuarioProp, modoEdicao = false }: any) {
  const styles = useUaiFrilaStyles();
  const [queroTrampar, setQueroTrampar] = useState(true);
  const [queroContratar, setQueroContratar] = useState(false);
  const [form, setForm] = useState<any>({ 
    nome: '', cpf: '', email: '', cnpj: '', nomeFantasia: '', funcao: 'Garçom', valorHora: 20, bio: '', 
    bairro: 'Centro', endereco: '', cidade_id: 1, cep: '', numero: '', complemento: '', lat: undefined, lng: undefined, 
    termos: [false,false,false,false,false], temMei: false 
  });
  const [cidades, setCidades] = useState<any[]>([]);
  const [etapa, setEtapa] = useState<'form'|'codigo'>('form');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const getTipoChave = () => UsuarioService.getTipoChave(queroTrampar, queroContratar);
  const tipoAtual = (usuarioProp?.tipo_chave||'').toUpperCase();
  const isTipoRestrito = modoEdicao && tipoAtual && !UsuarioService.isTipoEditavel(tipoAtual);
  const isReadOnly = !!isTipoRestrito;

  useEffect(()=>{
    const tipo = localStorage.getItem('uaifrila_tipo_cadastro');
    if (tipo) {
      const checks = UsuarioService.parseTipoParaChecks(tipo);
      setQueroTrampar(checks.trampar);
      setQueroContratar(checks.contratar);
    }
    // FIX: endpoint correto agora é /api/cidades (ou /api/cidades/ativas alias)
    apiGetPublic('/api/cidades').then((d:any)=>setCidades(d.data || d.cidades || [])).catch(()=>{});
  }, []);

  useEffect(()=>{
    if (modoEdicao && usuarioProp) {
      const checks = UsuarioService.parseTipoParaChecks(usuarioProp.tipo_chave||'FREELA');
      setQueroTrampar(checks.trampar);
      setQueroContratar(checks.contratar);
      setForm({
        nome: usuarioProp.nome_completo||'', cpf: (usuarioProp.cpf||'').replace(/\D/g,''), email: usuarioProp.email||'',
        cnpj: (usuarioProp.cnpj||'').replace(/\D/g,''), nomeFantasia: usuarioProp.nome_fantasia||'',
        funcao: usuarioProp.funcao_principal||'Garçom', valorHora: usuarioProp.valor_hora_base||20, bio: usuarioProp.bio||'',
        bairro: usuarioProp.endereco_ativo_bairro||'Centro', endereco: usuarioProp.endereco_ativo_completo||'', cidade_id: usuarioProp.endereco_ativo_cidade_id||1,
        cep: usuarioProp.endereco_ativo_cep||'', numero: usuarioProp.endereco_ativo_numero||'', complemento: usuarioProp.endereco_ativo_complemento||'',
        lat: usuarioProp.endereco_ativo_lat, lng: usuarioProp.endereco_ativo_lng, termos: [true,true,true,true,true], temMei: usuarioProp.tem_mei||false
      });
    }
  }, [modoEdicao, usuarioProp]);

  const handleSubmit = async () => {
    if (isReadOnly) { setErro(`Tipo ${tipoAtual} só visualização`); return; }
    if (!form.nome || !form.cpf || !form.email) { setErro('Preencha nome, CPF, email'); return; }
    if (!queroTrampar && !queroContratar) { setErro('Escolha Trampar ou Contratar'); return; }
    setCarregando(true);
    setErro('');
    try {
      // FIX: fluxo passwordless novo - chama /api/auth/solicitar-codigo
      const res = await apiGetPublic('/api/paises'); // dummy para garantir API viva
      // 1 - Solicita código de cadastro
      await apiFetch('/api/auth/solicitar-codigo', { 
        method: 'POST', 
        body: JSON.stringify({ 
          email: form.email, 
          tipo: 'cadastro',
          nome: form.nome, cpf: form.cpf, cnpj: form.cnpj, nomeFantasia: form.nomeFantasia, 
          funcao: form.funcao, valorHora: form.valorHora, bio: form.bio, bairro: form.bairro, 
          endereco: form.endereco, cidade_id: form.cidade_id, lat: form.lat, lng: form.lng, 
          tipo_chave: getTipoChave(), temMei: form.temMei 
        }) 
      });
      setEtapa('codigo');
    } catch (e:any) { 
      // Fallback: se /solicitar-codigo falhar por já existir, tenta /auth/register antigo
      try {
        await apiFetch('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            nomeCompleto: form.nome, email: form.email, senha: form.cpf, cpf: form.cpf,
            tipoUsuarioId: getTipoChave()==='DUAL'?3:getTipoChave()==='CONTRATANTE'?2:1
          })
        });
        setEtapa('codigo');
      } catch (e2:any){
        setErro(e2.message || e.message);
      }
    } finally { setCarregando(false); }
  };

  if (etapa==='codigo') return <ValidacaoCodigo email={form.email} tipo="cadastro" onValidado={()=>onCadastro?.(form.email)} onVoltar={()=>setEtapa('form')} />;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>{modoEdicao ? 'Meu Perfil' : 'Cadastro'}</h2>
        {isReadOnly && <div className="mt-4 p-4 bg-yellow-300 border-4 border-black font-black text-xs">🔒 Tipo {tipoAtual} só visualização - editáveis: FREELA, CONTRATANTE, DUAL</div>}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button disabled={isReadOnly} onClick={()=>{ if (!isReadOnly) setQueroTrampar(!queroTrampar); }} className={`${queroTrampar ? styles.cardHighlight + ' p-6 flex gap-4' : styles.cardSmall + ' flex gap-4 opacity-70'} ${isReadOnly ? 'opacity-40' : ''}`}>
            <span>💪</span><div><div className="font-black uppercase text-sm">Quero Trampar</div></div><div className="ml-auto w-6 h-6 border-2 flex items-center justify-center">{queroTrampar && '✓'}</div>
          </button>
          <button disabled={isReadOnly} onClick={()=>{ if (!isReadOnly) setQueroContratar(!queroContratar); }} className={`${queroContratar ? 'p-6 border-4 bg-red-500 text-white border-black flex gap-4' : styles.cardSmall + ' flex gap-4 opacity-70'} ${isReadOnly ? 'opacity-40' : ''}`}>
            <span>🏢</span><div><div className="font-black uppercase text-sm">Quero Contratar</div></div><div className="ml-auto w-6 h-6 border-2 flex items-center justify-center">{queroContratar && '✓'}</div>
          </button>
        </div>
        {queroTrampar && queroContratar && <div className="mt-3 text-xs p-3 bg-green-200 border-2 border-black">✨ DUAL</div>}
        <div className="text-[10px] opacity-50 mt-2">Tipo: {getTipoChave()}</div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={styles.label}>Nome</label><input value={form.nome} disabled={isReadOnly} onChange={e=>setForm({...form, nome: e.target.value})} className={styles.input} /></div>
          <div><label className={styles.label}>CPF</label><input value={form.cpf} disabled={modoEdicao} onChange={e=>setForm({...form, cpf: e.target.value.replace(/\D/g,'')})} className={styles.input} /></div>
          <div><label className={styles.label}>E-mail</label><input value={form.email} disabled={modoEdicao} onChange={e=>setForm({...form, email: e.target.value})} className={styles.input} /></div>
          <div className="md:col-span-2"><BlocoEndereco form={form} setForm={setForm} cidades={cidades} titulo="ENDEREÇO" subtitulo={isReadOnly ? 'Visualização' : 'Preencha CEP'} /></div>
        </div>
        {erro && <div className={styles.errorBox + ' mt-4'}>{erro}</div>}
        <button onClick={handleSubmit} disabled={carregando || isReadOnly} className={`${styles.buttonPrimary(carregando || isReadOnly)} mt-8`}>{isReadOnly ? 'Somente Visualização' : `Cadastrar como ${getTipoChave()}`}</button>
      </div>
    </div>
  );
}

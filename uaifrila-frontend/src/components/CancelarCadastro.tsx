import React, { useState, useEffect } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import { apiGetPublic, clearAuth } from '../utils/Api';

// CancelarCadastro - CORRIGIDO 401
// ANTES: usava apiFetch('/auth/cancelar-cadastro') -> apiFetch manda Authorization: Bearer <token>
//   - Sem token: backend (rota atrás de authMiddleware) dava 401
//   - Com token velho/inválido: apiFetch faz clearAuth() no 401 e o usuário era deslogado
// AGORA: apiGetPublic -> SEM Authorization, SEM clearAuth. Cancelar é PÚBLICO: a prova é email + codigo, não token.
// Backend: rota tem que estar ANTES de authMiddleware (PATCH_App_cancelar_publico.txt), senão continua 401.

export default function CancelarCadastro({ email: emailProp = '', codigo: codigoProp = '', onConcluido, onVoltar }: { email?: string; codigo?: string; onConcluido?: () => void; onVoltar?: () => void }) {
  const styles = useUaiFrilaStyles();
  const [email] = useState(emailProp);
  const [codigo] = useState(codigoProp);
  const [confirmado, setConfirmado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  useEffect(() => { if (!email || !codigo) setErro('Link de cancelamento inválido - faltam e-mail ou código.'); }, [email, codigo]);
  const handleCancelar = async () => {
    if (!confirmado) { setErro('Marque "Entendo que meus dados serão apagados" para cancelar.'); return; }
    if (!email || !codigo) return;
    setCarregando(true); setErro(''); setSucesso('');
    try {
      const data: any = await apiGetPublic('/api/auth/cancelar-cadastro', { method: 'POST', body: JSON.stringify({ email, codigo }) });
      setSucesso(data.message || 'Cadastro cancelado. Você pode cadastrar novamente.');
      try { clearAuth(); localStorage.removeItem('uaifrila_cadastro_pendente'); localStorage.removeItem('uaifrila_validacao_pendente'); window.history.replaceState({}, '', window.location.pathname); } catch {}
      setTimeout(() => onConcluido?.(), 2000);
    } catch (e: any) { setErro(e.message || 'Erro ao cancelar cadastro'); } finally { setCarregando(false); }
  };
  return (
    <div className={styles.pageContainerSmall}><div className={styles.card}>
      <h1 className={styles.typography.h1}>Cancelar Cadastro</h1>
      <p className={`${styles.typography.bodySmall} mt-2`}>E-mail: <strong>{email || '(não informado)'}</strong></p>
      <div className={`${styles.cardSmall} mt-4`}><p className={styles.typography.bodySmall}>Ao cancelar:</p>
        <ul className={`${styles.typography.bodySmall} mt-2 space-y-1`}>
          <li>• Seu e-mail vira <strong>{'{id}'}@cancelado.com</strong> e seu CPF vira <strong>{'{id}'}</strong></li>
          <li>• Nome, telefone, endereço, bio e demais dados protegidos serão <strong>apagados</strong></li>
          <li>• Status vira <strong>CANCELADO</strong> - você perde o acesso</li>
          <li>• Você pode <strong>cadastrar novamente</strong> com o mesmo e-mail e CPF</li>
        </ul>
      </div>
      {erro && <div className={`${styles.errorBox} mt-4`}>{erro}</div>}
      {sucesso && <div className={`${styles.successBox} mt-4`}>{sucesso}</div>}
      {!sucesso && (<>
        <label className="flex gap-3 items-start mt-4 cursor-pointer"><input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span className={styles.typography.bodySmall}>Entendo que meus dados serão apagados e perderei o acesso. Quero cancelar meu cadastro.</span></label>
        <button type="button" onClick={handleCancelar} disabled={!confirmado || carregando || !email || !codigo} className={`${styles.buttonPrimary(!confirmado || carregando)} mt-6 w-full !bg-red-600`}>{carregando ? 'Cancelando...' : 'Cancelar meu cadastro'}</button>
        <button type="button" onClick={onVoltar} className={`${styles.buttonSecondary} mt-3 w-full`}>Não cancelar, voltar</button>
      </>)}
    </div></div>
  );
}

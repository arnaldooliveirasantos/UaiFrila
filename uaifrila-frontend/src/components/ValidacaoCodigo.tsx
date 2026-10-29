import React, { useState } from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

interface Props {
  email: string;
  tipo: 'cadastro' | 'login';
  onValidado: (dados: any) => void;
  onVoltar: () => void;
}

export default function ValidacaoCodigo({ email, tipo, onValidado, onVoltar }: Props) {
  const styles = useUaiFrilaStyles();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const API = import.meta.env.VITE_API_URL;
  if (!API) throw new Error('VITE_API_URL não definida - verifique sua configuração');

  const validar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(`${API}/auth/validar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, tipo })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Serviço indisponível no momento. Tente novamente.`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Código inválido');
      onValidado(data);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  const reenviar = async () => {
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch(`${API}/auth/reenviar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tipo })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        await res.text();
        throw new Error('Não foi possível reenviar o código. Tente novamente.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.erro || 'Erro ao reenviar');
      alert('Código reenviado para ' + email);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className={styles.pageContainerSmall}>
      <div className={styles.card}>
        <h2 className={styles.typography.h1}>Validar Código</h2>
        <p className={`${styles.typography.bodySmall} mt-2 ${styles.isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
          Código enviado para <span className="font-bold">{email}</span>
        </p>

        <div className="mt-6 flex flex-col gap-1">
          <label className={styles.label}>Código de 6 dígitos</label>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className={`${styles.input} text-center text-2xl tracking-[0.5em] font-black`}
            maxLength={6}
            inputMode="numeric"
          />
        </div>

        {erro && (
          <div className={`${styles.errorBox} mt-3 break-words`}>
            ❌ {erro}
          </div>
        )}

        <button
          onClick={validar}
          disabled={carregando || codigo.length !== 6}
          className={`${styles.buttonPrimary(carregando || codigo.length !== 6)} mt-6`}
        >
          {carregando ? 'Validando...' : 'Validar'}
        </button>

        <div className="mt-3 flex gap-2">
          <button
            onClick={reenviar}
            disabled={carregando}
            className={styles.buttonSecondary + ' flex-1 py-3'}
          >
            Reenviar
          </button>
          <button
            onClick={onVoltar}
            className={styles.buttonGhost + ' flex-1 border-2 ' + (styles.isDark ? 'border-zinc-700' : 'border-black/20')}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

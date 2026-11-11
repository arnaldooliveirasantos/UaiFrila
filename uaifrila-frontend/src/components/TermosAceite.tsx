import React from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// Termos de Aceite - os mesmos do PainelTermos v12 que já existia
// REGRA: SEM botão de tema aqui. Troca de tema só no Navbar.
// Só lê o tema via useUaiFrilaStyles().

export interface TermoAceiteItem { id: string; titulo: string; texto: string; obrigatorio: boolean; }

export const TERMOS_ACEITE: TermoAceiteItem[] = [
  {
    id: 'sem_vinculo_clt',
    titulo: 'Sem vínculo CLT',
    texto: 'O UaiFrila é uma plataforma de intermediação de freelas de bar, sem vínculo CLT (Art. 442-B). Não há relação de emprego entre freela, contratante e plataforma.',
    obrigatorio: true,
  },
  {
    id: 'pagamento_escrow',
    titulo: 'Pagamento via escrow',
    texto: 'Pagamento via escrow: 14% no cartão, 10% no Pix, liberado após foto de conclusão do trampo.',
    obrigatorio: true,
  },
  {
    id: 'cancelamento',
    titulo: 'Cancelamento',
    texto: 'Cancelamento: até 60 min antes sem custo, após multa de 50% do valor do trampo.',
    obrigatorio: true,
  },
  {
    id: 'lgpd',
    titulo: 'LGPD - uso dos dados',
    texto: 'LGPD: seus dados são tratados apenas para match, pagamento e segurança da plataforma.',
    obrigatorio: true,
  },
  {
    id: 'termos_uso_privacidade',
    titulo: 'Termos de Uso e Política de Privacidade',
    texto: 'Li e aceito os Termos de Uso e a Política de Privacidade do Uai Frila.',
    obrigatorio: true,
  },
];

interface Props {
  valores: boolean[]; // mesmo formato antigo: [false,false,false,false,false]
  onChange: (novos: boolean[]) => void;
  disabled?: boolean;
  modoEdicao?: boolean;
}

export default function TermosAceite({ valores, onChange, disabled, modoEdicao }: Props) {
  const styles = useUaiFrilaStyles();
  const todosMarcados = valores.length === TERMOS_ACEITE.length && valores.every(Boolean);
  const qtdMarcados = valores.filter(Boolean).length;

  const alternar = (i: number) => {
    if (disabled) return;
    const novos = [...valores];
    novos[i] = !novos[i];
    onChange(novos);
  };
  const marcarTodos = () => { if (!disabled) onChange(TERMOS_ACEITE.map(() => true)); };
  const desmarcarTodos = () => { if (!disabled) onChange(TERMOS_ACEITE.map(() => false)); };

  if (modoEdicao) {
    return (
      <div className={`${styles.cardSmall} mt-6`}>
        <p className={styles.typography.h3}>📄 Termos de Aceite</p>
        <p className={`${styles.typography.bodySmall} mt-2`}><span className={styles.badge('success')}>✓ Termos aceitos no cadastro</span> Não é preciso aceitar de novo para editar o perfil.</p>
        <div className="mt-3 space-y-2">
          {TERMOS_ACEITE.map((t) => (
            <p key={t.id} className={styles.typography.caption}>✓ {t.titulo} - {t.texto}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.cardSmall} mt-6`}>
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <p className={styles.typography.h3}>📄 Termos de Aceite</p>
          <p className={`${styles.typography.caption} mt-1`}>Leia e marque todos para continuar. {qtdMarcados}/{TERMOS_ACEITE.length} aceitos.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={marcarTodos} disabled={disabled} className={styles.buttonSecondary}>Marcar todos</button>
          <button type="button" onClick={desmarcarTodos} disabled={disabled} className={styles.buttonSecondary}>Desmarcar</button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {TERMOS_ACEITE.map((t, i) => {
          const marcado = !!valores[i];
          return (
            <label key={t.id} className={`flex gap-3 items-start p-3 border-2 cursor-pointer ${marcado ? 'border-black' : ''} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
              <input
                type="checkbox"
                checked={marcado}
                disabled={disabled}
                onChange={() => alternar(i)}
                className="mt-0.5 w-5 h-5 accent-black shrink-0"
              />
              <span>
                <span className={`${styles.typography.bodySmall} font-black`}>{i + 1}. {t.titulo} *</span>
                <span className={`${styles.typography.bodySmall} block mt-0.5 opacity-80`}>{t.texto}</span>
              </span>
            </label>
          );
        })}
      </div>

      {!todosMarcados && (
        <p className="text-[11px] font-bold mt-3">⚠️ Marque os {TERMOS_ACEITE.length} termos para habilitar o botão Cadastrar.</p>
      )}
    </div>
  );
}

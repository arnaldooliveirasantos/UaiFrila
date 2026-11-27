import React from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
// Indicador: SO mostra as etapas, SEM botoes. Pode ficar no topo.
// Navegacao: O UNICO conjunto de botoes Voltar / Continuar / Finalizar.
// NUNCA renderizar a navegacao 2x na mesma tela (era isso que duplicava os botoes).
export function WizardIndicador({ etapas, etapa }: { etapas: string[]; etapa: number }) {
  const styles = useUaiFrilaStyles();
  return (<>
    <div className="flex flex-wrap items-center gap-2 mt-4" aria-label="Etapas">
      {etapas.map((nome, i) => (
        <React.Fragment key={nome}>
          <span className={i === etapa ? styles.badge('warning') : i < etapa ? styles.badge('success') : styles.badge('default')}>
            {i + 1}. {nome}{i < etapa ? ' ✓' : ''}
          </span>
          {i < etapas.length - 1 && <span aria-hidden>→</span>}
        </React.Fragment>
      ))}
    </div>
    <p className={styles.typography.caption + ' mt-1'}>Etapa {etapa + 1} de {etapas.length} — nada é salvo até você concluir a última etapa.</p>
  </>);
}
export function WizardNavegacao({ etapas, etapa, onVoltar, onAvancar, onFinalizar, avancarLabel, finalizarLabel, carregando, podeFinalizar = true }: {
  etapas: string[]; etapa: number;
  onVoltar: () => void; onAvancar: () => void; onFinalizar: () => void;
  avancarLabel?: string; finalizarLabel: string; carregando?: boolean; podeFinalizar?: boolean;
}) {
  const styles = useUaiFrilaStyles();
  const ultima = etapa >= etapas.length - 1;
  return (
    <div className="flex flex-wrap gap-2 mt-6">
      {etapa > 0 && <button type="button" onClick={onVoltar} className={styles.buttonSecondary}>← Voltar</button>}
      {!ultima && <button type="button" onClick={onAvancar} className={styles.buttonPrimary(false)}>{avancarLabel || 'Continuar →'}</button>}
      {ultima && <button type="button" onClick={onFinalizar} disabled={carregando || !podeFinalizar} className={styles.buttonPrimary(carregando || !podeFinalizar)}>{carregando ? 'Salvando...' : finalizarLabel}</button>}
    </div>
  );
}
// Compat: nome antigo = indicador (sem botoes). Quem importava WizardEtapas
// como botoes deve usar WizardNavegacao.
export default WizardIndicador;

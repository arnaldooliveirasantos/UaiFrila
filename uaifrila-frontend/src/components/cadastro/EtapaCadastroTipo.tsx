import React from 'react';
import { useUaiFrilaStyles } from '../../styles/uaifrila.styles';
// Etapa 1/4 - Como voce vai usar. So muda o estado em memoria.
export default function EtapaCadastroTipo({ queroTrampar, setQueroTrampar, queroContratar, setQueroContratar, isReadOnly, travaTrampar, travaContratar, getTipoChave }: any) {
  const styles = useUaiFrilaStyles();
  return (<>
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <button disabled={isReadOnly || travaTrampar} onClick={() => { if (!isReadOnly && !travaTrampar) setQueroTrampar(!queroTrampar); }} className={`${queroTrampar ? styles.cardHighlight + ' p-6 flex gap-4' : styles.cardSmall + ' flex gap-4 opacity-70'} ${(isReadOnly || travaTrampar) ? 'opacity-40' : ''}`}>
        <span>💪</span><div><div className="font-black uppercase text-sm">Quero Trampar{travaTrampar ? ' 🔒' : ''}</div></div><div className="ml-auto w-6 h-6 border-2 flex items-center justify-center">{queroTrampar && '✓'}</div>
      </button>
      <button disabled={isReadOnly || travaContratar} onClick={() => { if (!isReadOnly && !travaContratar) setQueroContratar(!queroContratar); }} className={`${queroContratar ? 'p-6 border-4 bg-red-500 text-white border-black flex gap-4' : styles.cardSmall + ' flex gap-4 opacity-70'} ${(isReadOnly || travaContratar) ? 'opacity-40' : ''}`}>
        <span>🏢</span><div><div className="font-black uppercase text-sm">Quero Contratar{travaContratar ? ' 🔒' : ''}</div></div><div className="ml-auto w-6 h-6 border-2 flex items-center justify-center">{queroContratar && '✓'}</div>
      </button>
    </div>
    {queroTrampar && queroContratar && <div className="mt-3 text-xs p-3 bg-green-200 border-2 border-black">✨ DUAL</div>}
    <div className="text-[10px] opacity-50 mt-2">DEBUG: {getTipoChave()} trampar={queroTrampar ? 'sim' : 'nao'} contratar={queroContratar ? 'sim' : 'nao'}</div>
  </>);
}

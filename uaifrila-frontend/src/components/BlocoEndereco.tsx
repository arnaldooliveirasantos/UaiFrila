import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';
import CadastroEndereco from './CadastroEndereco';

export default function BlocoEndereco({ onEnderecoSelecionado, modoVaga = false }: any) {
  const styles = useUaiFrilaStyles();
  const [ativo, setAtivo] = useState<any>(null);
  const [mostrar, setMostrar] = useState(false);
  const [loading, setLoading] = useState(true);

  const carregarAtivo = async () => {
    try {
      setLoading(true);
      let data: any = null;
      try {
        data = await apiFetch('/api/enderecos/meus');
      } catch {
        try {
          data = await apiFetch('/api/enderecos/ativo');
        } catch {
          data = null;
        }
      }
      
      let end: any = null;
      if (data) {
        if (data.data) {
          end = Array.isArray(data.data) ? data.data[0] : data.data;
        } else if (data.endereco) {
          end = data.endereco;
        } else if (Array.isArray(data)) {
          end = data[0] || null;
        } else {
          end = data;
        }
      }
      
      setAtivo(end);
    } catch (e: any) {
      console.warn('[BlocoEndereco] sem endereço ativo:', e.message);
      setAtivo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAtivo();
  }, []);

  const handleSelecionado = (end: any) => {
    setAtivo(end);
    setMostrar(false);
    onEnderecoSelecionado?.(end?.id, end);
  };

  if (loading) {
    return (
      <div className={styles.cardSmall}>
        <p className={`${styles.typography.body} animate-pulse`}>Carregando endereço...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header com título e botão trocar */}
      <div className="flex justify-between items-center">
        <h4 className={styles.typography.h3}>Endereço {modoVaga ? 'da Vaga' : 'Ativo'} (Estado via Cidade)</h4>
        <button onClick={() => setMostrar(!mostrar)} className={styles.buttonSecondary}>
          {mostrar ? 'Fechar' : 'Trocar'}
        </button>
      </div>

      {/* Card do endereço ativo - agora com styles context */}
      {ativo ? (
        <div className={`${styles.cardSmall} border-green-600 ${styles.isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <div className="flex justify-between items-start">
            <div className={styles.typography.label}>{ativo.apelido || ativo.tipo_nome || 'Ativo'}</div>
            <span className={styles.badge('success')}>Ativo</span>
          </div>
          <div className={`${styles.typography.body} mt-2 font-black`}>
            {ativo.endereco_completo || `${ativo.logradouro || ''} ${ativo.numero || ''} ${ativo.bairro || ''}`.trim()}
          </div>
          <div className={`${styles.typography.bodySmall} mt-1 ${styles.isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
            {ativo.cidade_nome || ativo.cidade?.nome || ''} / {ativo.estado_sigla || ativo.cidade_estado_sigla || ativo.estado || ''} 
            {ativo.cep && ` • CEP: ${ativo.cep}`}
          </div>
          <div className={`${styles.typography.caption} mt-1`}>
            Estado {ativo.estado_sigla || ativo.cidade_estado_sigla || ''} derivado de {ativo.cidade_nome || ''} via cidades.estado_id
          </div>
          {ativo.endereco_formatado && (
            <div className={`${styles.typography.caption} mt-2 italic`}>
              {ativo.endereco_formatado}
            </div>
          )}
        </div>
      ) : (
        <div className={`${styles.cardSmall} border-dashed text-center`}>
          <p className={styles.typography.body}>Nenhum endereço ativo</p>
          <p className={`${styles.typography.caption} mt-1`}>Cadastre um endereço em Perfil ou selecione abaixo</p>
        </div>
      )}

      {/* Seletor / Cadastro */}
      {mostrar && (
        <div className={styles.card}>
          <h4 className={`${styles.typography.h3} mb-3`}>Selecionar Endereço</h4>
          <CadastroEndereco 
            modoSelecao={modoVaga} 
            onEnderecoSelecionado={handleSelecionado} 
          />
        </div>
      )}
    </div>
  );
}

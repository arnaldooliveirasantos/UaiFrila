import React, { useState } from 'react';
import { useUaiFrilaStyles } from '../../styles/uaifrila.styles';
import BlocoEndereco from '../BlocoEndereco';
import CadastroEndereco from '../CadastroEndereco';
import type { VagaForm, CalculoBackend } from './types';
// Etapa 3/4 - Endereco e valores. So edita o form em memoria, nao salva.
export default function EtapaVagaEnderecoValores({ form, setForm, carregandoEnderecoAtivo, turnos, turnosOrdenados, valorTotalTurnos, calculoBackend }: {
  form: VagaForm; setForm: (f: any) => void; carregandoEnderecoAtivo: boolean;
  turnos: any[]; turnosOrdenados: any[]; valorTotalTurnos: number; calculoBackend: CalculoBackend | null;
}) {
  const styles = useUaiFrilaStyles();
  // Troca EXPLICITA na etapa: nao depende do botao Trocar interno do
  // BlocoEndereco. Ao clicar, abre a lista de enderecos do usuario
  // (CadastroEndereco em modo selecao) + o form de novo endereco.
  // Escolher um endereco aqui atualiza form.enderecoId / enderecoAtivo
  // e o BlocoEndereco passa a exibir o novo.
  const [trocando, setTrocando] = useState(false);
  return (<>
    <div>
      <label className={styles.label}>Endereço da Vaga * (já vem com seu ativo marcado)</label>
      {carregandoEnderecoAtivo ? (
        <div className={`${styles.cardSmall} animate-pulse`}><p className={styles.typography.bodySmall}>Carregando endereço ativo...</p></div>
      ) : (
        <BlocoEndereco enderecoFixo={form.enderecoAtivo} onEnderecoSelecionado={(id: number, end: any) => { setForm((f: any) => ({ ...f, enderecoId: id, enderecoAtivo: end })); }} modoVaga={true} />
      )}
      {form.enderecoAtivo && (
        <div className={`${styles.cardSmall} mt-2 border-green-600 ${styles.isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
          <div className="flex justify-between items-center gap-2 flex-wrap">
            <p className={styles.typography.body}>✓ Usando: {form.enderecoAtivo.endereco_completo || `${form.enderecoAtivo.logradouro} ${form.enderecoAtivo.numero || ''}`} - {form.enderecoAtivo.bairro}</p>
            <span className={styles.badge('success')}>Ativo</span>
          </div>
          <p className={styles.typography.caption}>ID: {form.enderecoId} • {form.enderecoAtivo.cidade_nome} / {form.enderecoAtivo.estado_sigla} • CEP {form.enderecoAtivo.cep}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            <button type="button" onClick={() => setTrocando(!trocando)} className={styles.buttonSecondary}>{trocando ? 'Fechar troca' : 'Trocar endereço'}</button>
          </div>
          {trocando && (
            <div className={`${styles.card} mt-2`}>
              <CadastroEndereco modoSelecao={true} onEnderecoSelecionado={(id: number, end: any) => { setForm((f: any) => ({ ...f, enderecoId: id, enderecoAtivo: end })); setTrocando(false); }} onSalvo={() => { /* lista recarrega sozinha no CadastroEndereco */ }} />
            </div>
          )}
        </div>
      )}
      {!form.enderecoId && !carregandoEnderecoAtivo && (
        <div className={`${styles.errorBox} mt-2`}>Nenhum endereço ativo encontrado. Vá em Perfil e cadastre um endereço, ou selecione abaixo em Trocar.</div>
      )}
    </div>
    {calculoBackend && (() => {
      const Q = Number(form.quantidadeVagas) || 1;
      const S = calculoBackend.valor_servico; const T = calculoBackend.valor_transporte;
      const totalGeralCartao = (calculoBackend.total_cartao || calculoBackend.total_contratante) * Q;
      const totalGeralPix = (calculoBackend.total_pix || 0) * Q;
      const economiaGeral = (calculoBackend.economia_pix || 0) * Q;
      const fmtB = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;
      return (
        <div className={styles.valorBox}>
          <p className={styles.typography.body}><strong>Por vaga (por candidato):</strong> Serviço {fmtB(S)} • Transporte {fmtB(T)}</p>
          <p className={styles.typography.body}>Total para {Q} vaga(s): Serviço {fmtB(S * Q)} • Transporte {fmtB(T * Q)}</p>
          <p className={styles.typography.body}><strong>Total geral a pagar (cartão): {fmtB(totalGeralCartao)}</strong></p>
          {totalGeralPix > 0 && <p className={styles.typography.bodySmall}>Se pagar com Pix: {fmtB(totalGeralPix)} — você economiza {fmtB(economiaGeral)}</p>}
          <p className={styles.typography.bodySmall}>Freela recebe por vaga: {fmtB(calculoBackend.freela_recebe_liquido)}</p>
          <p className={styles.typography.caption}>O método de pagamento é escolhido só na hora de pagar. O total acima usa a taxa do cartão do provedor ativo.</p>
        </div>
      );
    })()}
  </>);
}

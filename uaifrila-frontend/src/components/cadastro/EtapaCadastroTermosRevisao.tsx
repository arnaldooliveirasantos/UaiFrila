import React from 'react';
import { useUaiFrilaStyles } from '../../styles/uaifrila.styles';
import { formatarCPF } from '../../utils/mascaras';
// Etapa 4/4 - Termos e revisao. So leitura + checkboxes locais: termos NAO
// vao para o banco. O botao do orchestrador e que envia o codigo.
export default function EtapaCadastroTermosRevisao({ form, setForm, isReadOnly, getTipoChave }: any) {
  const styles = useUaiFrilaStyles();
  const setTermo = (i: number, v: boolean) => { const termos = [...(form.termos || [false, false, false, false, false])]; termos[i] = v; setForm({ ...form, termos }); };
  return (<>
    <div className="mt-6 space-y-2">
      <h3 className={styles.typography.h3}>Termos de aceite (ao concluir o cadastro, considera-se que você aceitou todos)</h3>
      <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[0]} disabled={isReadOnly} onChange={e => setTermo(0, e.target.checked)} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">1. Autônomo Art. 442-B CLT</span><span className={styles.typography.bodySmall + ' block'}>Sou autônomo, sem vínculo CLT. Não há horário fixo, só trampo por diária.</span></span></label>
      <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[1]} disabled={isReadOnly} onChange={e => setTermo(1, e.target.checked)} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">2. LGPD</span><span className={styles.typography.bodySmall + ' block'}>Meus dados (CPF, e-mail, bairro) são usados só para conectar você ao trampo.</span></span></label>
      <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[2]} disabled={isReadOnly} onChange={e => setTermo(2, e.target.checked)} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">3. MEI R$1500</span><span className={styles.typography.bodySmall + ' block'}>Limite de R$1500 por contratante por mês para não caracterizar vínculo.</span></span></label>
      <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[3]} disabled={isReadOnly} onChange={e => setTermo(3, e.target.checked)} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">4. Cancelamento R$40</span><span className={styles.typography.bodySmall + ' block'}>Cancelamento em menos de 12h antes do trampo gera taxa de R$40.</span></span></label>
      <label className="flex gap-3 items-start cursor-pointer border-2 border-black p-3"><input type="checkbox" checked={!!form.termos?.[4]} disabled={isReadOnly} onChange={e => setTermo(4, e.target.checked)} className="mt-0.5 w-5 h-5 accent-black shrink-0" /><span><span className="font-black text-xs">5. Intermediação 15%</span><span className={styles.typography.bodySmall + ' block'}>Taxa de intermediação de 15% sobre a diária. Freela recebe 85%.</span></span></label>
      <p className={styles.typography.caption}>Você pode marcar/desmarcar para ler, mas concluir o cadastro já vale como aceite de todos. Nada disso é gravado no banco.</p>
    </div>
    <div className={styles.cardSmall + ' mt-4'}>
      <p className={styles.typography.body + ' font-black'}>Revisão — nada foi salvo ainda</p>
      <p className={styles.typography.bodySmall}>{form.nome} • CPF {formatarCPF(form.cpf || '')} • {form.email} • {getTipoChave()} • {form.endereco || ''} {form.numero || ''}, {form.bairro || ''} — CEP {form.cep || ''}</p>
      <p className={styles.typography.caption}>Ao concluir, só é enviado o código de verificação (POST /api/auth/solicitar-codigo). O usuário + endereço só são gravados depois, no validar-código.</p>
    </div>
  </>);
}

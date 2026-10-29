
import React from 'react';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

export default function CodigoFreela({ setTelaAtiva }: { setTelaAtiva: (t: string) => void }) {
  const styles = useUaiFrilaStyles();

  return (
    <div className={styles.pageContainer + ' max-w-4xl'}>
      <h1 className={styles.typography.h1 + ' text-4xl mt-4'}>Código Freela UAI FRILA</h1>
      <p className={styles.typography.bodySmall + ' mt-2 opacity-70'}>Transparência total para freelas e contratantes.</p>

      <div className={styles.card + ' mt-8'}>
        <h2 className={styles.typography.h2 + ' text-lg'}>1. Autônomo Art 442-B CLT</h2>
        <p className={styles.typography.bodySmall + ' mt-2 leading-relaxed'}>Você é autônomo, sem vínculo CLT. Emite nota como MEI ou recebe como autônomo. Não há horário fixo, só trampo por diária.</p>
      </div>

      <div className={styles.card + ' mt-4'}>
        <h2 className={styles.typography.h2 + ' text-lg'}>2. LGPD</h2>
        <p className={styles.typography.bodySmall + ' mt-2 leading-relaxed'}>Seus dados (CPF, e-mail, bairro) são usados só para conectar você ao trampo. CPF bloqueado para edição por segurança.</p>
      </div>

      <div className={styles.card + ' mt-4'}>
        <h2 className={styles.typography.h2 + ' text-lg'}>3. MEI R$1500</h2>
        <p className={styles.typography.bodySmall + ' mt-2'}>Limite de R$1500 por contratante por mês para não caracterizar vínculo. Acima disso, plataforma pausa novos trampos com mesmo contratante.</p>
      </div>

      <div className={styles.card + ' mt-4'}>
        <h2 className={styles.typography.h2 + ' text-lg'}>4. Cancelamento R$40</h2>
        <p className={styles.typography.bodySmall + ' mt-2'}>Cancelamento em menos de 12h antes do trampo gera taxa de R$40 para compensar contratante e freela reserva.</p>
      </div>

      <div className={styles.card + ' mt-4'}>
        <h2 className={styles.typography.h2 + ' text-lg'}>5. Intermediação</h2>
        <p className={styles.typography.bodySmall + ' mt-2'}>Taxa de intermediação de 15% sobre valor da diária. Freela recebe 85%, plataforma 15% para operação, suporte e garantia.</p>
      </div>

      <div className={`${styles.card} mt-8 border-dashed`}>
        <h3 className={styles.typography.h3}>Modo DUAL - Regra importante</h3>
        <p className={styles.typography.bodySmall + ' mt-2'}>Você pode ser Freela e Contratante ao mesmo tempo (DUAL). Uma vez que vira DUAL, não pode voltar para modo simples por segurança contratual. No cadastro você escolhe, na edição pode evoluir para DUAL mas não voltar.</p>
        <button onClick={() => setTelaAtiva('cadastro')} className={styles.buttonPrimary() + ' mt-4 w-auto px-6'}>Quero me cadastrar</button>
      </div>
    </div>
  );
}

export const PainelTermos: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-black border-2 border-[#0066FF] text-white space-y-4">
      <h2 className="text-xl font-black uppercase">📄 Termo de Aceite v12</h2>
      <div className="text-xs leading-relaxed space-y-3 text-gray-300">
        <p><strong>1.</strong> O UaiFrila é uma plataforma de intermediação de freelas de bar, sem vínculo CLT (Art. 442-B).</p>
        <p><strong>2.</strong> Pagamento via escrow: 14% cartão, 10% Pix, liberado após foto de conclusão.</p>
        <p><strong>3.</strong> Cancelamento: até 60 min antes sem custo, após multa de 50%.</p>
        <p><strong>4.</strong> LGPD: dados tratados apenas para match e pagamento.</p>
      </div>
    </div>
  );
};

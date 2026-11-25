import React from 'react';
import BlocoEndereco from '../BlocoEndereco';
// Etapa 3/4 - Endereco. So edita o form em memoria, nao salva.
export default function EtapaCadastroEndereco({ form, setForm, cidades, isReadOnly, modoEdicao }: any) {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2"><BlocoEndereco form={form} setForm={setForm} cidades={cidades} titulo="ENDEREÇO" subtitulo={isReadOnly ? 'Visualização' : 'Preencha CEP'} modoCadastro={!modoEdicao} /></div>
    </div>
  );
}

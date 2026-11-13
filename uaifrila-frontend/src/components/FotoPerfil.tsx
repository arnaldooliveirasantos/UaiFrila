import React, { useEffect, useRef, useState } from 'react';
import { salvarFoto } from '../services/FuncoesService';
// Exibe a foto que veio do banco (usuario.foto) e salva a nova.
// CORREÇÃO 1: antes, useState(usuario?.foto) só lia a foto UMA vez, na montagem.
// Como o PerfilUsuario carrega o usuário DEPOIS (GET /auth/me), a prévia
// ficava null para sempre. Agora useEffect sincroniza toda vez que usuario.foto muda.
// CORREÇÃO 2: "Remover" antes só apagava a prévia na tela — ao recarregar, a foto
// voltava, porque nada era gravado no banco. Agora Remover grava foto=null na API.
export default function FotoPerfil({ usuario, onSalvo }: { usuario: any; onSalvo?: (foto: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previa, setPrevia] = useState<string | null>(usuario?.foto || null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => { setPrevia(usuario?.foto || null); }, [usuario?.foto]);
  const escolher = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arq = e.target.files?.[0]; if (!arq) return;
    if (!arq.type.startsWith('image/')) { setErro('Escolha um arquivo de imagem.'); return; }
    if (arq.size > 2 * 1024 * 1024) { setErro('A foto deve ter no máximo 2 MB.'); return; }
    const leitor = new FileReader();
    leitor.onload = () => setPrevia(String(leitor.result));
    leitor.readAsDataURL(arq);
  };
  const salvar = async () => {
    if (!previa || !usuario?.id) return;
    setSalvando(true); setErro('');
    try { await salvarFoto(usuario.id, previa); onSalvo?.(previa); } catch (e: any) { setErro(e.message || 'Erro ao salvar foto'); } finally { setSalvando(false); }
  };
  const remover = async () => {
    if (!usuario?.id) return;
    setSalvando(true); setErro('');
    try { await salvarFoto(usuario.id, null); setPrevia(null); onSalvo?.(null); } catch (e: any) { setErro(e.message || 'Erro ao remover foto'); } finally { setSalvando(false); }
  };
  const inicial = (usuario?.nome_completo || usuario?.nome || 'U').trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-black text-white flex items-center justify-center text-2xl font-black shrink-0">
        {previa ? <img src={previa} alt="Foto de perfil" className="w-full h-full object-cover" /> : inicial}
      </div>
      <div>
        <p className="text-xs font-black uppercase">Foto de perfil</p>
        <p className="text-xs opacity-70">Aparece para o contratante na tela de aceite.</p>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => inputRef.current?.click()} className="px-3 py-2 text-xs font-black uppercase bg-black text-white rounded">Escolher foto</button>
          {previa && previa !== usuario?.foto && <button type="button" disabled={salvando} onClick={salvar} className="px-3 py-2 text-xs font-black uppercase bg-green-600 text-white rounded">{salvando ? 'Salvando...' : 'Salvar foto'}</button>}
          {previa && <button type="button" disabled={salvando} onClick={remover} className="px-3 py-2 text-xs font-black uppercase border rounded">Remover</button>}
        </div>
        {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={escolher} />
      </div>
    </div>
  );
}

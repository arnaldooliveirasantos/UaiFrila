import React, { useEffect, useRef, useState } from 'react';
import { salvarFoto } from '../services/FuncoesService';

// CORREÇÃO DO CLIQUE "TIRAR RETRATO":
// BUG: o código antigo fazia setTimeout(50ms) para ligar o stream no <video>.
// No PC o React ainda não tinha renderizado o <video> nesses 50ms, então
// videoRef.current era null, o stream ficava sem destino, a tela ficava
// preta e o Capturar falhava com "Aguarde a câmera ligar".
// AGORA: o stream só é ligado dentro de um useEffect que roda DEPOIS que
// o <video> já existe na tela (quando cameraAberta vira true). Também
// espera o evento loadedmetadata antes de liberar o Capturar.
// + Fallback no PC: se a webcam for bloqueada (HTTP por IP, sem permissão),
// abre o seletor de arquivo em vez de travar sem opção.
function fotoValida(valor: string | null | undefined): boolean {
  if (!valor || typeof valor !== 'string') return false;
  if (valor.startsWith('data:image/')) return valor.includes(',') && valor.length > 100;
  return valor.startsWith('http://') || valor.startsWith('https://');
}
function ehPC(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer:fine)').matches && !window.matchMedia('(pointer:coarse)').matches;
}
async function comprimirArquivo(arquivo: File): Promise<string> {
  const nome = (arquivo.name || '').toLowerCase();
  const tipo = (arquivo.type || '').toLowerCase();
  if (nome.endsWith('.heic') || nome.endsWith('.heif') || tipo.includes('heic') || tipo.includes('heif')) {
    throw new Error('Este aparelho salvou a foto em HEIC/HEIF, que o navegador não abre. Salve a foto como JPG e tente de novo.');
  }
  if (arquivo.size > 30 * 1024 * 1024) throw new Error('Foto muito grande (mais de 30 MB).');
  let bitmap: ImageBitmap | null = null;
  let imgEl: HTMLImageElement | null = null;
  let objectUrl = '';
  try {
    if ('createImageBitmap' in window) {
      try { bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' } as any); } catch { bitmap = null; }
    }
    if (!bitmap) {
      objectUrl = URL.createObjectURL(arquivo);
      imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = () => reject(new Error('Não consegui abrir essa foto. Salve como JPG e tente de novo.'));
        im.src = objectUrl;
      });
    }
  } catch (e) { if (objectUrl) URL.revokeObjectURL(objectUrl); throw e; }
  const w0 = bitmap ? bitmap.width : (imgEl?.naturalWidth || 0);
  const h0 = bitmap ? bitmap.height : (imgEl?.naturalHeight || 0);
  if (!w0 || !h0) throw new Error('Não consegui ler o tamanho dessa foto.');
  const MAX = 800;
  let atual: any = bitmap || imgEl;
  let w = w0, h = h0;
  while (w > MAX || h > MAX) {
    const escala = Math.min(0.5, MAX / Math.max(w, h));
    const nw = Math.max(1, Math.round(w * escala)), nh = Math.max(1, Math.round(h * escala));
    const cv = document.createElement('canvas'); cv.width = nw; cv.height = nh;
    cv.getContext('2d')!.drawImage(atual, 0, 0, nw, nh);
    if (atual instanceof ImageBitmap) atual.close();
    atual = cv; w = nw; h = nh;
  }
  const final = document.createElement('canvas');
  final.width = w; final.height = h;
  final.getContext('2d')!.drawImage(atual, 0, 0);
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  if (atual instanceof ImageBitmap) atual.close();
  return final.toDataURL('image/jpeg', 0.82);
}
export default function FotoPerfil({ usuario, onSalvo }: { usuario: any; onSalvo?: (foto: string | null) => void }) {
  const galeriaRef = useRef<HTMLInputElement>(null);
  const cameraArquivoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previa, setPrevia] = useState<string | null>(fotoValida(usuario?.foto) ? usuario.foto : null);
  const [quebrada, setQuebrada] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [cameraAberta, setCameraAberta] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [abrindoCamera, setAbrindoCamera] = useState(false);
  const [erro, setErro] = useState('');
  const [noPC] = useState(() => ehPC());
  useEffect(() => {
    setPrevia(fotoValida(usuario?.foto) ? usuario.foto : null);
    setQuebrada(false);
    if (usuario?.foto && !fotoValida(usuario.foto)) setErro('A foto salva anteriormente está corrompida. Tire o retrato ou escolha a foto novamente e salve.');
  }, [usuario?.foto]);
  // Liga o stream no <video> SÓ DEPOIS que o <video> já existe na tela.
  useEffect(() => {
    if (!cameraAberta || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.srcObject !== streamRef.current) video.srcObject = streamRef.current;
    video.play().catch(() => {});
  }, [cameraAberta]);
  useEffect(() => () => { pararCamera(); }, []);
  const pararCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraAberta(false);
    setCameraPronta(false);
    setAbrindoCamera(false);
  };
  const abrirCamera = async () => {
    setErro(''); setCameraPronta(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErro('Este navegador não consegue tirar o retrato. Use "escolher um arquivo".');
      galeriaRef.current?.click();
      return;
    }
    // HTTPS é obrigatório para webcam. Em HTTP por IP o navegador bloqueia.
    if (window.isSecureContext === false) {
      setErro('O navegador bloqueia a webcam em página sem HTTPS (ex.: http://192.168...). Abra o app por HTTPS ou localhost, ou use "escolher um arquivo".');
      galeriaRef.current?.click();
      return;
    }
    setAbrindoCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraAberta(true); // o useEffect acima liga o stream no <video>
    } catch (e: any) {
      setAbrindoCamera(false);
      if (e?.name === 'NotAllowedError') {
        setErro(noPC
          ? 'Permissão da webcam negada. Libere em: cadeado da barra de endereço > Permissões > Câmera > Permitir, e clique em Tirar Retrato de novo.'
          : 'Permissão da câmera negada. Libere a câmera (cadeado da barra de endereço > Permissões > Câmera) ou use Escolher foto.');
      } else if (e?.name === 'NotFoundError' || e?.name === 'OverconstrainedError') {
        setErro('Nenhuma câmera encontrada neste aparelho (ou ela está em uso por outro programa/aba). Feche outros programas que usam a câmera e tente de novo.');
      } else {
        setErro('Não consegui tirar o retrato: ' + (e?.message || e?.name || 'erro desconhecido'));
      }
      if (!noPC) cameraArquivoRef.current?.click();
      else galeriaRef.current?.click();
    } finally { setAbrindoCamera(false); }
  };
  const capturar = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) { setErro('Aguarde a câmera ligar (imagem aparecer) antes de capturar.'); return; }
    const MAX = 800;
    const escala = Math.min(1, MAX / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * escala);
    canvas.height = Math.round(video.videoHeight * escala);
    const ctx = canvas.getContext('2d');
    if (!ctx) { setErro('Não consegui capturar a foto.'); return; }
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPrevia(canvas.toDataURL('image/jpeg', 0.82));
    setQuebrada(false);
    pararCamera();
  };
  const escolherArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const arq = e.target.files?.[0];
    e.target.value = '';
    if (!arq) return;
    setErro(''); setQuebrada(false); setProcessando(true);
    try { setPrevia(await comprimirArquivo(arq)); }
    catch (err: any) { setErro(err.message || 'Não consegui processar essa foto. Tente outra foto.'); }
    finally { setProcessando(false); }
  };
  const salvar = async () => {
    if (!previa || !usuario?.id) return;
    setSalvando(true); setErro('');
    try { await salvarFoto(usuario.id, previa); onSalvo?.(previa); } catch (e: any) { setErro(e.message || 'Erro ao salvar foto'); } finally { setSalvando(false); }
  };
  const remover = async () => {
    if (!usuario?.id) return;
    setSalvando(true); setErro('');
    try { await salvarFoto(usuario.id, null); setPrevia(null); setQuebrada(false); onSalvo?.(null); } catch (e: any) { setErro(e.message || 'Erro ao remover foto'); } finally { setSalvando(false); }
  };
  const inicial = (usuario?.nome_completo || usuario?.nome || 'U').trim().charAt(0).toUpperCase();
  const mostrarImg = !!previa && !quebrada;
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-black text-white flex items-center justify-center text-2xl font-black shrink-0">
        {mostrarImg ? (
          <img src={previa as string} alt="" aria-hidden="true" className="w-full h-full object-cover" onError={() => setQuebrada(true)} />
        ) : (inicial)}
      </div>
      <div className="flex-1">
        <p className="text-xs font-black uppercase">Foto de perfil</p>
        <p className="text-xs opacity-70">Aparece para o contratante na tela de aceite.</p>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          <button type="button" disabled={processando || abrindoCamera} onClick={abrirCamera} className="px-4 py-2 text-xs font-black uppercase bg-black text-white rounded">
            {abrindoCamera ? 'Tirando retrato...' : '📷 Tirar Retrato'}
          </button>
          {previa && previa !== usuario?.foto && <button type="button" disabled={salvando} onClick={salvar} className="px-3 py-2 text-xs font-black uppercase bg-green-600 text-white rounded">{salvando ? 'Salvando...' : 'Salvar foto'}</button>}
          {previa && <button type="button" disabled={salvando} onClick={remover} className="px-3 py-2 text-xs font-black uppercase border rounded">Remover</button>}
        </div>
        <button type="button" disabled={processando} onClick={() => galeriaRef.current?.click()} className="mt-1 text-xs underline opacity-70">
          ou escolher um arquivo
        </button>
        {processando && <p className="text-xs opacity-70 mt-1">Processando a foto...</p>}
        {erro && <p className="text-xs text-red-600 mt-1">{erro}</p>}
        <input ref={galeriaRef} type="file" accept="image/*,.jpg,.jpeg,.png,.webp" className="hidden" onChange={escolherArquivo} />
        <input ref={cameraArquivoRef} type="file" accept="image/*" capture="user" className="hidden" onChange={escolherArquivo} />
      </div>
      {cameraAberta && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <p className="text-white text-sm font-black uppercase mb-3">Posicione o rosto no círculo</p>
          <video
            ref={videoRef} autoPlay playsInline muted
            onLoadedMetadata={() => setCameraPronta(true)}
            className="w-full max-w-md aspect-square object-cover rounded-full bg-neutral-800"
            style={{ transform: 'scaleX(-1)' }}
          />
          {!cameraPronta && <p className="text-white text-xs mt-3 animate-pulse">Ligando a câmera...</p>}
          <div className="flex gap-3 mt-4">
            <button type="button" disabled={!cameraPronta} onClick={capturar} className="px-6 py-3 text-sm font-black uppercase bg-white text-black rounded-full disabled:opacity-50">
              {cameraPronta ? 'Capturar' : 'Aguarde...'}
            </button>
            <button type="button" onClick={pararCamera} className="px-6 py-3 text-sm font-black uppercase border border-white text-white rounded-full">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

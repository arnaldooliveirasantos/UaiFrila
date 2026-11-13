import React, { useState, useEffect, useRef } from 'react';
import { apiGetPublic } from '../utils/Api';
import { useUaiFrilaStyles } from '../styles/uaifrila.styles';

// ANTES (mock): catch { setCidades([{ id:1, nome:'Uberlândia', ... }]) } - inventava cidade se a API falhasse.
// AGORA (API real): se GET /cidades/ativas falhar, mostra o erro da API. NUNCA inventa cidade.
// Também: não auto-seleciona a 1a cidade sozinho, e usa apiGetPublic (rota pública), não fetch solto.

interface Cidade { id: number; nome: string; estado: string; lat?: number; lng?: number; raio_km?: number; }
interface Props { endereco: string; cidade: string; cidadeId?: number; lat?: number; lng?: number; onChange: (data: { endereco: string; cidade: string; cidade_id?: number; lat?: number; lng?: number; bairro?: string }) => void; }

export default function GoogleEnderecoInput({ endereco, cidade, cidadeId, lat, lng, onChange }: Props) {
  const styles = useUaiFrilaStyles();
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [busca, setBusca] = useState(endereco);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState(cidade || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const GOOGLE_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_KEY || '';

  useEffect(() => {
    (async () => {
      setErro('');
      try {
        const data = await apiGetPublic('/cidades/ativas');
        const lista = data.cidades || data.data || [];
        setCidades(lista);
        if (!cidadeSelecionada && lista.length === 0) setErro('Nenhuma cidade ativa na API.');
      } catch (e: any) { setErro(e.message || 'Erro ao carregar cidades da API'); setCidades([]); }
    })();
  }, []);
  useEffect(() => { setBusca(endereco); }, [endereco]);
  useEffect(() => { setCidadeSelecionada(cidade); }, [cidade]);

  useEffect(() => {
    if (!GOOGLE_KEY || !inputRef.current) return;
    if ((window as any).google?.maps?.places) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (!inputRef.current) return;
      const cidadeObj = cidades.find(c => c.nome === cidadeSelecionada);
      const options: any = { types: ['address'], componentRestrictions: { country: 'br' } };
      if (cidadeObj?.lat && cidadeObj?.lng) options.bounds = new (window as any).google.maps.Circle({ center: { lat: cidadeObj.lat, lng: cidadeObj.lng }, radius: (cidadeObj.raio_km || 20) * 1000 }).getBounds();
      const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, options);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const la = place.geometry?.location?.lat(); const lo = place.geometry?.location?.lng();
        const bairroComp = place.address_components?.find((c: any) => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.long_name;
        const cidadeComp = place.address_components?.find((c: any) => c.types.includes('administrative_area_level_2'))?.long_name;
        const cidadeFinal = cidadeComp || cidadeSelecionada;
        onChange({ endereco: place.formatted_address || busca, cidade: cidadeFinal, cidade_id: cidades.find(c => c.nome.toLowerCase() === cidadeFinal.toLowerCase())?.id, lat: la, lng: lo, bairro: bairroComp });
        setBusca(place.formatted_address || busca); setSugestoes([]);
      });
    };
    document.head.appendChild(script);
  }, [GOOGLE_KEY, cidades, cidadeSelecionada]);

  const buscarSugestoes = async (q: string) => {
    if (q.length < 3) { setSugestoes([]); return; }
    setCarregando(true);
    try {
      {
        const cidadeObj = cidades.find(c => c.nome === cidadeSelecionada);
        const viewbox = cidadeObj ? `${cidadeObj.lng! - 0.2},${cidadeObj.lat! + 0.2},${cidadeObj.lng! + 0.2},${cidadeObj.lat! - 0.2}` : '';
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${encodeURIComponent(q + ' ' + cidadeSelecionada)}&viewbox=${viewbox}&bounded=1&limit=5`);
        const data = await res.json();
        setSugestoes(data.map((d: any) => ({ formatted_address: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon), bairro: d.display_name.split(',')[1]?.trim() })));
      }
    } catch { setSugestoes([]); } finally { setCarregando(false); }
  };
  const selecionarSugestao = (s: any) => {
    setBusca(s.formatted_address);
    onChange({ endereco: s.formatted_address, cidade: cidadeSelecionada, cidade_id: cidades.find(c => c.nome === cidadeSelecionada)?.id, lat: s.lat, lng: s.lng, bairro: s.bairro });
    setSugestoes([]);
  };
  const handleCidadeChange = (novaCidade: string) => {
    setCidadeSelecionada(novaCidade);
    const c = cidades.find(x => x.nome === novaCidade);
    onChange({ endereco: busca, cidade: novaCidade, cidade_id: c?.id, lat, lng });
  };
  return (
    <div className="space-y-4">
      {erro && <div className={styles.errorBox}>{erro}</div>}
      <div className="flex flex-col gap-1"><label className={styles.label}>Cidade</label>
        <select value={cidadeSelecionada} onChange={e => handleCidadeChange(e.target.value)} className={styles.select}>
          <option value="">Selecione a cidade (API)</option>
          {cidades.map(c => <option key={c.id} value={c.nome}>{c.nome} - {c.estado}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-1"><label className={styles.label}>Endereço completo</label>
        <div className="relative"><input ref={inputRef} value={busca} onChange={e => { setBusca(e.target.value); buscarSugestoes(e.target.value); onChange({ endereco: e.target.value, cidade: cidadeSelecionada, cidade_id: cidades.find(c => c.nome === cidadeSelecionada)?.id, lat, lng }); }} placeholder={`Digite seu endereço em ${cidadeSelecionada || 'sua cidade'}...`} className={`${styles.input} pr-10`} /><div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">{carregando ? '⏳' : '📍'}</div></div>
        {sugestoes.length > 0 && <ul className="border-2 border-black bg-white max-h-40 overflow-auto">{sugestoes.map((s: any, i: number) => <li key={i} onClick={() => selecionarSugestao(s)} className="p-2 text-xs cursor-pointer hover:bg-zinc-100">{s.formatted_address}</li>)}</ul>}
      </div>
    </div>
  );
}

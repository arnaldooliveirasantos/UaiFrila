import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

interface Cidade {
  id: number;
  nome: string;
  estado: string;
  lat?: number;
  lng?: number;
  raio_km?: number;
}

interface Props {
  endereco: string;
  cidade: string;
  cidadeId?: number;
  lat?: number;
  lng?: number;
  onChange: (data: { endereco: string; cidade: string; cidade_id?: number; lat?: number; lng?: number; bairro?: string }) => void;
}

export default function GoogleEnderecoInput({ endereco, cidade, cidadeId, lat, lng, onChange }: Props) {
  const { isDark } = useTheme();
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [busca, setBusca] = useState(endereco);
  const [sugestoes, setSugestoes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState(cidade || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

  useEffect(() => {
    const fetchCidades = async () => {
      try {
        const res = await fetch(`${API}/cidades/ativas`);
        const data = await res.json();
        if (data.cidades) {
          setCidades(data.cidades);
          if (!cidadeSelecionada && data.cidades.length > 0) {
            setCidadeSelecionada(data.cidades[0].nome);
            onChange({ endereco, cidade: data.cidades[0].nome, cidade_id: data.cidades[0].id });
          }
        }
      } catch {
        setCidades([{ id: 1, nome: 'Uberlândia', estado: 'MG', lat: -18.9186, lng: -48.2772 }]);
      }
    };
    fetchCidades();
  }, []);

  useEffect(() => { setBusca(endereco); }, [endereco]);
  useEffect(() => { setCidadeSelecionada(cidade); }, [cidade]);

  // Carrega Google Places se tiver chave
  useEffect(() => {
    if (!GOOGLE_KEY || !inputRef.current) return;
    if ((window as any).google?.maps?.places) return;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => {
      if (!inputRef.current) return;
      const cidadeObj = cidades.find(c => c.nome === cidadeSelecionada);
      const options: any = {
        types: ['address'],
        componentRestrictions: { country: 'br' },
      };
      if (cidadeObj?.lat && cidadeObj?.lng) {
        options.bounds = new (window as any).google.maps.Circle({
          center: { lat: cidadeObj.lat, lng: cidadeObj.lng },
          radius: (cidadeObj.raio_km || 20) * 1000
        }).getBounds();
        options.strictBounds = false;
      }
      const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, options);
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        const bairroComp = place.address_components?.find((c:any) => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.long_name;
        const cidadeComp = place.address_components?.find((c:any) => c.types.includes('administrative_area_level_2'))?.long_name;
        const cidadeFinal = cidadeComp || cidadeSelecionada;
        onChange({
          endereco: place.formatted_address || busca,
          cidade: cidadeFinal,
          cidade_id: cidades.find(c => c.nome.toLowerCase() === cidadeFinal.toLowerCase())?.id,
          lat, lng,
          bairro: bairroComp
        });
        setBusca(place.formatted_address || busca);
        setSugestoes([]);
      });
    };
    document.head.appendChild(script);
  }, [GOOGLE_KEY, cidades, cidadeSelecionada]);

  const buscarSugestoes = async (q: string) => {
    if (q.length < 3) { setSugestoes([]); return; }
    setCarregando(true);
    try {
      if (GOOGLE_KEY) {
        // Usa Google Places Text Search via proxy ou direto (se tiver key, já tem autocomplete)
        // Fallback: busca via backend que deve chamar Google
        const res = await fetch(`${API}/enderecos/buscar?q=${encodeURIComponent(q)}&cidade=${encodeURIComponent(cidadeSelecionada)}`);
        if (res.ok) {
          const data = await res.json();
          setSugestoes(data.resultados || []);
        } else {
          // Mock local se não tem backend
          setSugestoes([]);
        }
      } else {
        // Sem Google Key: usa Nominatim OSM restrito à cidade
        const cidadeObj = cidades.find(c => c.nome === cidadeSelecionada);
        const viewbox = cidadeObj ? `${cidadeObj.lng! - 0.2},${cidadeObj.lat! + 0.2},${cidadeObj.lng! + 0.2},${cidadeObj.lat! - 0.2}` : '';
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=br&q=${encodeURIComponent(q + ' ' + cidadeSelecionada)}&viewbox=${viewbox}&bounded=1&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        setSugestoes(data.map((d:any) => ({
          formatted_address: d.display_name,
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          bairro: d.display_name.split(',')[1]?.trim()
        })));
      }
    } catch (e) {
      setSugestoes([]);
    } finally { setCarregando(false); }
  };

  const selecionarSugestao = (s: any) => {
    setBusca(s.formatted_address);
    onChange({
      endereco: s.formatted_address,
      cidade: cidadeSelecionada,
      cidade_id: cidades.find(c => c.nome === cidadeSelecionada)?.id,
      lat: s.lat,
      lng: s.lng,
      bairro: s.bairro
    });
    setSugestoes([]);
    setErro('');
  };

  const handleCidadeChange = (novaCidade: string) => {
    setCidadeSelecionada(novaCidade);
    const c = cidades.find(x => x.nome === novaCidade);
    onChange({ endereco: busca, cidade: novaCidade, cidade_id: c?.id, lat, lng });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-black uppercase flex items-center gap-2">
          Cidade <span className="px-1 bg-[#FFC700] text-black text-[8px] border border-black">OBRIGATÓRIO</span>
        </label>
        <select
          value={cidadeSelecionada}
          onChange={e => handleCidadeChange(e.target.value)}
          className={`w-full mt-1 px-4 py-3 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`}
        >
          {cidades.length === 0 && <option>Carregando cidades ativas...</option>}
          {cidades.map(c => (
            <option key={c.id} value={c.nome}>{c.nome} - {c.estado}</option>
          ))}
        </select>
        <p className="text-[9px] mt-1 opacity-60">Só é permitido endereço dentro de cidades ativas. {cidades.length} cidade(s) ativa(s).</p>
      </div>

      <div>
        <label className="text-[10px] font-black uppercase flex items-center gap-2">
          Endereço completo (busca no Google Maps) 
          {GOOGLE_KEY ? <span className="px-1 bg-green-200 text-black text-[8px] border">GOOGLE MAPS</span> : <span className="px-1 bg-zinc-200 text-black text-[8px] border">OSM</span>}
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            value={busca}
            onChange={e => { setBusca(e.target.value); buscarSugestoes(e.target.value); onChange({ endereco: e.target.value, cidade: cidadeSelecionada, cidade_id: cidades.find(c => c.nome === cidadeSelecionada)?.id, lat, lng }); }}
            placeholder={`Digite seu endereço em ${cidadeSelecionada}... Ex: Rua Floriano Peixoto 1000`}
            className={`w-full mt-1 px-4 py-3 pr-10 text-sm border-2 ${isDark ? 'bg-black text-white border-white' : 'bg-white text-black border-black'}`}
          />
          <div className="absolute right-3 top-[55%] -translate-y-1/2 text-xs">
            {carregando ? '⏳' : '📍'}
          </div>
        </div>
        {erro && <p className="text-[10px] text-red-600 mt-1">{erro}</p>}
        <p className="text-[9px] mt-1 opacity-60">
          {GOOGLE_KEY ? 'Busca via Google Places restrita à cidade ativa.' : 'Sem chave Google: usando OpenStreetMap. Adicione VITE_GOOGLE_MAPS_KEY no .env para Google Maps completo.'}
          {lat && lng && <span className="ml-2 font-mono">📍 {lat.toFixed(5)}, {lng.toFixed(5)}</span>}
        </p>

        {sugestoes.length > 0 && (
          <div className={`mt-2 border-2 ${isDark ? 'bg-black border-white' : 'bg-white border-black'} max-h-48 overflow-y-auto`}>
            {sugestoes.map((s, i) => (
              <button
                key={i}
                onClick={() => selecionarSugestao(s)}
                className={`w-full text-left px-3 py-2 text-xs border-b hover:bg-[#FFC700] hover:text-black ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-black'}`}
              >
                <div className="font-bold">📍 {s.formatted_address?.slice(0, 80)}</div>
                {s.bairro && <div className="text-[10px] opacity-60">Bairro: {s.bairro}</div>}
              </button>
            ))}
          </div>
        )}
      </div>

      {busca && cidadeSelecionada && (
        <div className={`p-2 border text-[10px] ${isDark ? 'bg-zinc-800 border-white/20 text-zinc-300' : 'bg-yellow-50 border-black/10 text-black'}`}>
          <div>✅ Endereço: <span className="font-bold">{busca}</span></div>
          <div>Cidade: <span className="font-bold">{cidadeSelecionada}</span> {cidades.find(c => c.nome === cidadeSelecionada) ? '(ativa)' : '(inativa - bloqueada)'}</div>
          {lat && lng && <div>Coordenadas: {lat}, {lng}</div>}
        </div>
      )}
    </div>
  );
}
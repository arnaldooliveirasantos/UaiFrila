import React, { useState, useEffect, useRef } from 'react';
import { useTheme, getInputClass, getLabelClass } from '../context/ThemeContext';

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
        const res = await fetch(`${API}/enderecos/buscar?q=${encodeURIComponent(q)}&cidade=${encodeURIComponent(cidadeSelecionada)}`);
        if (res.ok) {
          const data = await res.json();
          setSugestoes(data.resultados || []);
        }
      } else {
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
    } catch {
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
  };

  const handleCidadeChange = (novaCidade: string) => {
    setCidadeSelecionada(novaCidade);
    const c = cidades.find(x => x.nome === novaCidade);
    onChange({ endereco: busca, cidade: novaCidade, cidade_id: c?.id, lat, lng });
  };

  const inputClass = getInputClass(isDark);
  const labelClass = getLabelClass(isDark);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className={labelClass}>Cidade</label>
        <select
          value={cidadeSelecionada}
          onChange={e => handleCidadeChange(e.target.value)}
          className={inputClass}
        >
          {cidades.length === 0 && <option>Carregando cidades...</option>}
          {cidades.map(c => (
            <option key={c.id} value={c.nome}>{c.nome} - {c.estado}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className={labelClass}>Endereço completo</label>
        <div className="relative">
          <input
            ref={inputRef}
            value={busca}
            onChange={e => { setBusca(e.target.value); buscarSugestoes(e.target.value); onChange({ endereco: e.target.value, cidade: cidadeSelecionada, cidade_id: cidades.find(c => c.nome === cidadeSelecionada)?.id, lat, lng }); }}
            placeholder={`Digite seu endereço em ${cidadeSelecionada}...`}
            className={`${inputClass} pr-10`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs">
            {carregando ? '⏳' : '📍'}
          </div>
        </div>

        {sugestoes.length > 0 && (
          <div className={`mt-2 border-2 max-h-48 overflow-y-auto ${isDark ? 'bg-black border-white' : 'bg-white border-black'}`}>
            {sugestoes.map((s, i) => (
              <button
                key={i}
                onClick={() => selecionarSugestao(s)}
                className={`w-full text-left px-3 py-2 text-xs border-b hover:bg-[#FFC700] hover:text-black ${isDark ? 'border-white/10 text-white' : 'border-black/10 text-black'}`}
              >
                <div className="font-bold truncate">📍 {s.formatted_address?.slice(0, 80)}</div>
                {s.bairro && <div className="text-[10px] opacity-60">Bairro: {s.bairro}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

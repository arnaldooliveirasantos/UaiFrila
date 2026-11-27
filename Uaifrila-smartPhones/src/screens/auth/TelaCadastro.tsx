import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppButton, ErrorBox } from '../../components/AppButton';
import { apiGetPublic } from '../../services/api';
import { UsuarioService } from '../../services/UsuarioService';
const TIPOS = [
  { k: 'FREELA', label: 'Freela - Quero trampar' },
  { k: 'CONTRATANTE', label: 'Contratante - Quero contratar' },
  { k: 'DUAL', label: 'Dual - Trampar e contratar' },
];
export function TelaCadastro({ navigation }: any) {
  const { styles } = useTheme();
  const [etapa, setEtapa] = useState(0);
  const [tipo, setTipo] = useState('FREELA');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cidade, setCidade] = useState('');
  const [aceitou, setAceitou] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const proximo = () => {
    if (etapa === 1 && (!nome || !email.includes('@'))) { setErro('Informe nome e e-mail válido'); return; }
    setErro(''); setEtapa((e) => e + 1);
  };
  const enviar = async () => {
    if (!aceitou) { setErro('Aceite os termos para continuar'); return; }
    setCarregando(true); setErro('');
    try {
      const c = UsuarioService.parseTipoParaChecks(tipo);
      await apiGetPublic('/api/auth/cadastro', { method: 'POST', body: JSON.stringify({ nome, email: email.trim().toLowerCase(), tipo: UsuarioService.getTipoChave(c.trampar, c.contratar), cidade }) });
      navigation.navigate('Codigo', { email: email.trim().toLowerCase(), tipo: 'cadastro' });
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Cadastro</Text>
      <Text style={styles.subtitle}>Etapa {etapa + 1} de 4</Text>
      <ErrorBox msg={erro} />
      {etapa === 0 && TIPOS.map((t) => (
        <TouchableOpacity key={t.k} accessibilityRole="radio" accessibilityState={{ selected: tipo === t.k }} onPress={() => setTipo(t.k)} style={[styles.card, { borderWidth: tipo === t.k ? 4 : 2 }]}>
          <Text style={styles.subtitle}>{t.label}</Text>
        </TouchableOpacity>
      ))}
      {etapa === 1 && (
        <>
          <Text style={styles.label}>Nome *</Text>
          <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" />
          <View style={{ height: 12 }} />
          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="seu@email.com" />
        </>
      )}
      {etapa === 2 && (
        <>
          <Text style={styles.label}>Cidade</Text>
          <TextInput style={styles.input} value={cidade} onChangeText={setCidade} placeholder="Uberlândia - MG" />
          <Text style={styles.subtitle}>O endereço completo pode ser completado no Perfil.</Text>
        </>
      )}
      {etapa === 3 && (
        <>
          <View style={styles.card}><Text style={styles.label}>Revisão</Text><Text style={styles.subtitle}>{nome} - {email} - {tipo} - {cidade}</Text></View>
          <TouchableOpacity accessibilityRole="checkbox" accessibilityState={{ checked: aceitou }} onPress={() => setAceitou(!aceitou)}>
            <Text style={styles.subtitle}>{aceitou ? '☑' : '☐'} Aceito os termos do UaiFrila</Text>
          </TouchableOpacity>
        </>
      )}
      <View style={{ height: 16 }} />
      {etapa < 3 ? <AppButton title="Continuar" onPress={proximo} /> : <AppButton title="Criar conta" onPress={enviar} loading={carregando} />}
      {etapa > 0 && (<><View style={{ height: 12 }} /><AppButton title="Voltar" variant="secondary" onPress={() => setEtapa((e) => e - 1)} /></>)}
    </ScrollView>
  );
}

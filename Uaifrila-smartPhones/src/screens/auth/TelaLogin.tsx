import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../../components/Logo';
import { AppButton, ErrorBox } from '../../components/AppButton';
import { apiGetPublic } from '../../services/api';
import { BiometriaService } from '../../services/BiometriaService';
export function TelaLogin({ navigation }: any) {
  const { styles } = useTheme();
  const [email, setEmail] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const enviar = async () => {
    if (!email.includes('@')) { setErro('Informe um e-mail válido'); return; }
    setCarregando(true); setErro('');
    try {
      await apiGetPublic('/api/auth/solicitar-codigo', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), tipo: 'login' }) });
      navigation.navigate('Codigo', { email: email.trim().toLowerCase(), tipo: 'login' });
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  const bio = async () => {
    try {
      const t = await BiometriaService.autenticar();
      const { setToken } = await import('../../services/api');
      await setToken(t);
      navigation.reset({ index: 0, routes: [{ name: 'App' }] });
    } catch (e: any) { setErro(e.message); }
  };
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Logo />
      <Text style={[styles.title, { textAlign: 'center', marginTop: 12 }]}>Login - Apenas E-mail</Text>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>Sem senha. Código de 6 dígitos por e-mail, válido 5 min.</Text>
      <ErrorBox msg={erro} />
      <Text style={styles.label}>Email *</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="seu@email.com" accessibilityLabel="E-mail cadastrado" />
      <View style={{ height: 16 }} />
      <AppButton title="Enviar código" onPress={enviar} loading={carregando} />
      <View style={{ height: 12 }} />
      <AppButton title="Entrar com digital / PIN" variant="secondary" onPress={bio} />
      <View style={{ height: 12 }} />
      <AppButton title="Não tenho cadastro" variant="secondary" onPress={() => navigation.navigate('Cadastro')} />
    </ScrollView>
  );
}

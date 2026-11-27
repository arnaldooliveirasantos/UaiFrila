import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppButton, ErrorBox } from '../../components/AppButton';
import { apiGetPublic } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BiometriaService } from '../../services/BiometriaService';
export function TelaCodigo({ route, navigation }: any) {
  const { styles } = useTheme();
  const { email, tipo } = route.params;
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { login } = useAuth();
  const validar = async () => {
    if (codigo.length !== 6) { setErro('Digite os 6 dígitos'); return; }
    setCarregando(true); setErro('');
    try {
      const d = await apiGetPublic('/api/auth/validar-codigo', { method: 'POST', body: JSON.stringify({ email, tipo, codigo }) });
      if (tipo === 'cadastro') { navigation.navigate('Login'); return; }
      await login(d);
      const ativa = await BiometriaService.estaAtiva();
      if (!ativa) navigation.navigate('Biometria');
      else navigation.reset({ index: 0, routes: [{ name: 'App' }] });
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Código de 6 dígitos</Text>
      <Text style={styles.subtitle}>Enviamos para {email}. Válido por 5 min.</Text>
      <ErrorBox msg={erro} />
      <Text style={styles.label}>Código *</Text>
      <TextInput style={styles.input} value={codigo} onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" accessibilityLabel="Código de 6 dígitos" />
      <View style={{ height: 16 }} />
      <AppButton title="Validar" onPress={validar} loading={carregando} />
      <View style={{ height: 12 }} />
      <AppButton title="Voltar" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

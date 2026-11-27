import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppButton, ErrorBox } from '../../components/AppButton';
import { BiometriaService } from '../../services/BiometriaService';
export function TelaBiometria({ navigation }: any) {
  const { styles } = useTheme();
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const ativar = async () => {
    setCarregando(true); setErro('');
    try {
      const d = await BiometriaService.disponivel();
      if (!d.available) throw new Error('Este aparelho não tem biometria / PIN configurado');
      await BiometriaService.ativar();
      navigation.reset({ index: 0, routes: [{ name: 'App' }] });
    } catch (e: any) { setErro(e.message); } finally { setCarregando(false); }
  };
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={[styles.title, { textAlign: 'center', fontSize: 48 }]}>👆</Text>
      <Text style={[styles.title, { textAlign: 'center', marginTop: 12 }]}>Entrar com digital ou PIN</Text>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>Da próxima vez, use o mesmo método que desbloqueia seu celular. Seu token fica guardado com segurança e é revalidado na API.</Text>
      <ErrorBox msg={erro} />
      <AppButton title="Ativar biometria" onPress={ativar} loading={carregando} />
      <View style={{ height: 12 }} />
      <AppButton title="Usar código por e-mail" variant="secondary" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'App' }] })} />
    </ScrollView>
  );
}

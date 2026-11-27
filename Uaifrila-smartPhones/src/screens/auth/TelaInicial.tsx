import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../../components/Logo';
import { AppButton } from '../../components/AppButton';
export function TelaInicial({ navigation }: any) {
  const { styles } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Logo />
      <Text style={[styles.title, { textAlign: 'center', marginTop: 16 }]}>Trampe perto de você. Contrate sem enrolação.</Text>
      <Text style={[styles.subtitle, { textAlign: 'center' }]}>Publique vagas, encontre freelas e receba rápido.</Text>
      <View style={styles.card}><Text style={styles.label}>Encontre trampos</Text><Text style={styles.subtitle}>Veja vagas abertas perto de você no Mural.</Text></View>
      <View style={styles.card}><Text style={styles.label}>Publique vaga</Text><Text style={styles.subtitle}>Descreva o serviço, dias e valores por turno.</Text></View>
      <View style={styles.cardHighlight}><Text style={styles.label}>Receba rápido</Text><Text style={styles.subtitle}>Pix e cartão, com repasse claro para o freela.</Text></View>
      <AppButton title="Cadastro" onPress={() => navigation.navigate('Cadastro')} />
      <View style={{ height: 12 }} />
      <AppButton title="Entrar" variant="secondary" onPress={() => navigation.navigate('Login')} />
    </ScrollView>
  );
}

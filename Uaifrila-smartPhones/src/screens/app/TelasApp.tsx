import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, TextInput } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppButton, ErrorBox } from '../../components/AppButton';
import { apiFetch } from '../../services/api';
import { VagaService } from '../../services/VagaService';
import { useFiltroMural } from '../../hooks/useFiltroMural';
export function TelaHome({ navigation }: any) {
  const { styles } = useTheme(); const { usuario, logout } = useAuth();
  const tipo = (usuario?.tipo_chave || 'FREELA').toString().toUpperCase();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Início</Text>
      <Text style={styles.subtitle}>Olá, {usuario?.nome || usuario?.email} - Perfil: {tipo}</Text>
      <View style={styles.cardHighlight}><Text style={styles.label}>Ação rápida</Text><Text style={styles.subtitle}>{tipo === 'CONTRATANTE' ? 'Publique uma vaga e receba candidatos.' : 'Veja o Mural e candidate-se para trampos perto de você.'}</Text></View>
      <AppButton title={tipo === 'CONTRATANTE' ? 'Publicar vaga' : 'Ver Mural'} onPress={() => navigation.navigate(tipo === 'CONTRATANTE' ? 'Publicar' : 'Mural')} />
      <View style={{ height: 12 }} />
      <AppButton title="Meus Trampos" variant="secondary" onPress={() => navigation.navigate('Trampos')} />
      <View style={{ height: 12 }} />
      <AppButton title="Sair" variant="secondary" onPress={async () => { await logout(); }} />
    </ScrollView>
  );
}
export function TelaMural() {
  const { styles } = useTheme(); const [lista, setLista] = useState<any[]>([]); const [erro, setErro] = useState(''); const [carregando, setCarregando] = useState(false); const [offline, setOffline] = useState(false); const { filtro, salvar } = useFiltroMural();
  const carregar = async () => { setCarregando(true); setErro(''); try { const r = await VagaService.mural(filtro); setLista(r.lista); setOffline(r.offline); } catch (e: any) { setErro(e.message); } finally { setCarregando(false); } };
  useEffect(() => { carregar(); }, [filtro]);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Mural</Text>
      {offline && <Text style={styles.subtitle}>⚠️ Sem conexão - mostrando o último mural salvo.</Text>}
      <ErrorBox msg={erro} />
      <Text style={styles.label}>Filtro salvo</Text>
      <TextInput style={styles.input} value={filtro.q || ''} onChangeText={(v) => salvar({ ...filtro, q: v })} placeholder="Buscar por função ou cidade" accessibilityLabel="Filtrar mural" />
      <View style={{ height: 12 }} />
      <AppButton title="Recarregar" onPress={carregar} loading={carregando} />
      <View style={{ height: 12 }} />
      {lista.length === 0 ? <Text style={styles.subtitle}>Nenhum item. A API não retornou dados - sem dados inventados.</Text> : <FlatList scrollEnabled={false} data={lista} keyExtractor={(_, i) => String(i)} renderItem={({ item }) => (<View style={styles.card}><Text style={styles.label}>{item.titulo || item.nome || 'Item'}</Text><Text style={styles.subtitle}>{JSON.stringify(item).slice(0, 220)}</Text></View>)} />}
    </ScrollView>
  );
}
export function TelaPublicar() {
  const { styles } = useTheme(); const [erro, setErro] = useState('');
  return (<ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Publicar Vaga</Text><Text style={styles.subtitle}>Usa a mesma API do web (POST /api/vagas). O wizard completo de dias/turnos segue TelaCadastroVaga do frontend.</Text><ErrorBox msg={erro} /><AppButton title="Publicar" onPress={async () => { try { await VagaService.publicar({ titulo: 'Preencha no formulário completo' }); } catch (e: any) { setErro(e.message); } }} /></ScrollView>);
}
export function TelaTrampos() {
  const { styles } = useTheme(); const [lista, setLista] = useState<any[]>([]); const [erro, setErro] = useState('');
  useEffect(() => { VagaService.minhas().then((d) => setLista(d)).catch((e) => setErro(e.message)); }, []);
  return (<ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Meus Trampos</Text><ErrorBox msg={erro} />{lista.map((it, i) => (<View key={i} style={styles.card}><Text style={styles.subtitle}>{JSON.stringify(it).slice(0, 220)}</Text></View>))}</ScrollView>);
}
export function TelaCandidatos() {
  const { styles } = useTheme(); const [lista, setLista] = useState<any[]>([]); const [erro, setErro] = useState('');
  useEffect(() => { apiFetch('/api/candidaturas').then((d) => setLista(d.data || d.candidaturas || [])).catch((e) => setErro(e.message)); }, []);
  return (<ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Candidatos</Text><ErrorBox msg={erro} />{lista.map((it, i) => (<View key={i} style={styles.card}><Text style={styles.subtitle}>{JSON.stringify(it).slice(0, 220)}</Text></View>))}</ScrollView>);
}
export function TelaGanhos() {
  const { styles } = useTheme(); const [lista, setLista] = useState<any[]>([]); const [erro, setErro] = useState('');
  useEffect(() => { apiFetch('/api/ganhos').then((d) => setLista([d.data || d])).catch((e) => setErro(e.message)); }, []);
  return (<ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Meus Ganhos</Text><ErrorBox msg={erro} />{lista.map((it, i) => (<View key={i} style={styles.card}><Text style={styles.subtitle}>{JSON.stringify(it).slice(0, 220)}</Text></View>))}</ScrollView>);
}
export function TelaPix() {
  const { styles } = useTheme();
  return (<ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Dados Pix</Text><Text style={styles.subtitle}>Mesma API do web - DadosPix. Preencha sua chave Pix para receber.</Text></ScrollView>);
}
export function TelaNotificacoes() {
  const { styles } = useTheme(); const [lista, setLista] = useState<any[]>([]); const [erro, setErro] = useState('');
  useEffect(() => { apiFetch('/api/notificacoes').then((d) => setLista(d.data || d.notificacoes || [])).catch((e) => setErro(e.message)); }, []);
  return (<ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Notificações</Text><ErrorBox msg={erro} />{lista.map((it, i) => (<View key={i} style={styles.card}><Text style={styles.subtitle}>{JSON.stringify(it).slice(0, 220)}</Text></View>))}</ScrollView>);
}
export function TelaFuncoes() {
  const { styles } = useTheme();
  return (<ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Minhas Funções</Text><Text style={styles.subtitle}>Mesma API do web - MinhasFuncoes.</Text></ScrollView>);
}

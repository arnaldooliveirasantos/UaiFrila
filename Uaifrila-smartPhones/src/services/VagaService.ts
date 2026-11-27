import {apiFetch,apiGetPublic} from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
const KEY='uaifrila:mural-cache';
export class VagaService{
 static async mural(filtros:Record<string,string>={}){const q=new URLSearchParams(filtros).toString();try{const d=await apiFetch(`/api/vagas/abertas${q?'?'+q:''}`);const lista=d.data||d.vagas||d||[];await AsyncStorage.setItem(KEY,JSON.stringify({lista,quando:Date.now()}));return {lista,offline:false};}catch(e){const net=await NetInfo.fetch();if(!net.isConnected){const raw=await AsyncStorage.getItem(KEY);if(!raw) throw e;return {lista:JSON.parse(raw).lista,offline:true};}throw e;}}
 static async minhas(){const d=await apiFetch('/api/vagas/minhas');return d.data||d.vagas||[];}
 static async publicar(body:any){return apiFetch('/api/vagas',{method:'POST',body:JSON.stringify(body)});}
 static async candidatar(vagaId:number){return apiFetch('/api/candidaturas',{method:'POST',body:JSON.stringify({vaga_id:vagaId})});}
 static async minhasCandidaturas(){const d=await apiFetch('/api/candidaturas/minhas');return d.data||d.candidaturas||[];}
 static async cidades(){const d=await apiGetPublic('/api/cidades');return d.data||d.cidades||[];}
 static async tiposUsuario(){const d=await apiGetPublic('/api/tipos-usuario');return d.data||d.tipos||[];}
}

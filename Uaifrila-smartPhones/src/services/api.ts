// ÚNICA fonte de API no mobile — mesmos paths e regras do frontend web. SEM MOCK, SEM FALLBACK.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {API_URL} from '../config/env';
export function getApiUrl():string{if(!API_URL) throw new Error('EXPO_PUBLIC_API_URL não definido no .env');return API_URL.replace(/\/api\/?$/,'').replace(/\/$/,'');}
function join(path:string){const base=getApiUrl();const p=path.startsWith('/')?path:'/'+path;return `${base}${p.startsWith('/api/')?p:'/api'+p}`;}
export async function getToken(){const c=await Keychain.getGenericPassword();return c?c.password:null;}
export async function setToken(t:string){await Keychain.setGenericPassword('uaifrila_token',t,{service:'uaifrila_token'});await AsyncStorage.setItem('uaifrila_token',t);}
export async function clearAuth(){await Keychain.resetGenericPassword({service:'uaifrila_token'});await AsyncStorage.multiRemove(['uaifrila_token','uaifrila_usuario']);}
async function lerErro(res:Response,path:string){let m=`API ${res.status} em ${path}`;try{const j=await res.json();m=j.erro||j.message||j.error||m;}catch{}return new Error(m);}
export async function apiFetch(path:string,options:RequestInit={}){const token=await getToken();const res=await fetch(join(path),{...options,headers:{'Content-Type':'application/json',...(options.headers||{}),...(token?{Authorization:`Bearer ${token}`}:{})}});if(!res.ok){if(res.status===401&&path.includes('/auth/me')) await clearAuth();throw await lerErro(res,path);}return res.json();}
export async function apiGetPublic(path:string,options:RequestInit={}){const res=await fetch(join(path),{...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});if(!res.ok) throw await lerErro(res,path);return res.json();}

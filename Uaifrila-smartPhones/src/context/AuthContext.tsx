import React,{createContext,useContext,useEffect,useState} from 'react';
import * as Keychain from 'react-native-keychain';
import {apiFetch,clearAuth,getToken,setToken} from '../services/api';
export type Usuario={id:number;email:string;nome?:string;tipo_chave?:string;tipo?:any;foto?:string};
const Ctx=createContext<{usuario:Usuario|null;carregando:boolean;login:(d:any)=>Promise<void>;logout:()=>Promise<void>;setUsuario:(u:Usuario|null)=>void}>({usuario:null,carregando:true,login:async()=>{},logout:async()=>{},setUsuario:()=>{}});
export const useAuth=()=>useContext(Ctx);
export function AuthProvider({children}:{children:React.ReactNode}){
 const [usuario,setUsuario]=useState<Usuario|null>(null); const [carregando,setCarregando]=useState(true);
 useEffect(()=>{(async()=>{try{if(await getToken()){const d=await apiFetch('/api/auth/me');const u=d?.data?.id?d.data:d?.usuario??d;if(!u?.id) throw new Error('Sessão inválida');setUsuario(u);}}catch{await clearAuth();setUsuario(null);}finally{setCarregando(false);}})();},[]);
 const login=async(d:any)=>{const token=d?.token||d?.data?.token;const u=d?.usuario?.id?d.usuario:d?.data?.usuario?.id?d.data.usuario:d?.data?.id?d.data:null;if(!token||!u?.id) throw new Error('Validação ok, mas sem token/usuário');await setToken(token);setUsuario(u);};
 const logout=async()=>{await clearAuth();setUsuario(null);};
 return <Ctx.Provider value={{usuario,carregando,login,logout,setUsuario}}>{children}</Ctx.Provider>;
}

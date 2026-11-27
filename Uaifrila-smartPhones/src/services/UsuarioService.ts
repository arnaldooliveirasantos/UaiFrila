import {apiFetch} from './api';
export class UsuarioService{
 static getTipoChave(trampar:boolean,contratar:boolean){if(trampar&&contratar)return 'DUAL';if(trampar)return 'FREELA';if(contratar)return 'CONTRATANTE';return 'FREELA';}
 static parseTipoParaChecks(tipo:string){const t=(tipo||'').toUpperCase();if(t==='DUAL')return{trampar:true,contratar:true};if(t==='CONTRATANTE')return{trampar:false,contratar:true};return{trampar:true,contratar:false};}
 static async me(){const d=await apiFetch('/api/auth/me');return d.data||d.usuario||d;}
 static async listarFreelas(){const d=await apiFetch('/api/usuarios/freelas');return d.data||d.usuarios||[];}
}

import {useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY='uaifrila:filtro-mural';
export function useFiltroMural(){const [filtro,setFiltro]=useState<Record<string,string>>({});useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v) setFiltro(JSON.parse(v));});},[]);const salvar=async(f:Record<string,string>)=>{setFiltro(f);await AsyncStorage.setItem(KEY,JSON.stringify(f));};return {filtro,salvar};}

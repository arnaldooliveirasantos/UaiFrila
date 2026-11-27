import React,{createContext,useContext,useEffect,useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appearance} from 'react-native';
import {makeStyles} from '../theme/styles';
type Theme='light'|'dark';
const Ctx=createContext<{theme:Theme;isDark:boolean;toggleTheme:()=>void;styles:ReturnType<typeof makeStyles>}>({theme:'dark',isDark:true,toggleTheme:()=>{},styles:makeStyles(true)});
export const useTheme=()=>useContext(Ctx);
export function ThemeProvider({children}:{children:React.ReactNode}){
 const [theme,setTheme]=useState<Theme>('dark');
 useEffect(()=>{AsyncStorage.getItem('uaifrila:theme').then(v=>{if(v==='light'||v==='dark')setTheme(v);else setTheme(Appearance.getColorScheme()==='light'?'light':'dark');});},[]);
 const toggleTheme=()=>{const n=theme==='light'?'dark':'light';setTheme(n);AsyncStorage.setItem('uaifrila:theme',n);};
 return <Ctx.Provider value={{theme,isDark:theme==='dark',toggleTheme,styles:makeStyles(theme==='dark')}}>{children}</Ctx.Provider>;
}

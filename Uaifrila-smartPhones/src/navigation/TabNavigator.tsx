import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {TelaHome,TelaMural,TelaPublicar,TelaTrampos} from '../screens/app/TelasApp';
import {TelaPerfil} from '../screens/app/TelaPerfil';
const Tab=createBottomTabNavigator();
const ICONS:any={Home:'home',Mural:'briefcase-search',Publicar:'plus-circle',Trampos:'clipboard-list',Perfil:'account-circle'};
export function TabNavigator(){const {isDark}=useTheme();const {usuario}=useAuth();const tipo=(usuario?.tipo_chave||'FREELA').toString().toUpperCase();
 return <Tab.Navigator screenOptions={({route}:any)=>({headerShown:false,tabBarShowLabel:false,tabBarActiveTintColor:'#FFC700',tabBarInactiveTintColor:isDark?'#fff':'#000',tabBarStyle:{backgroundColor:isDark?'#000':'#fff',borderTopWidth:2,borderTopColor:isDark?'#fff':'#000',height:64,paddingBottom:8},tabBarIcon:({color,size}:any)=><Icon name={ICONS[route.name]||'circle'} color={color} size={28} accessibilityLabel={route.name}/>})}>
 <Tab.Screen name='Home' component={TelaHome}/><Tab.Screen name='Mural' component={TelaMural}/>
 {tipo!=='FREELA'&&<Tab.Screen name='Publicar' component={TelaPublicar}/>}
 <Tab.Screen name='Trampos' component={TelaTrampos}/><Tab.Screen name='Perfil' component={TelaPerfil}/>
 </Tab.Navigator>;}

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuth} from '../context/AuthContext';
import {TelaInicial} from '../screens/auth/TelaInicial';
import {TelaLogin} from '../screens/auth/TelaLogin';
import {TelaCodigo} from '../screens/auth/TelaCodigo';
import {TelaCadastro} from '../screens/auth/TelaCadastro';
import {TelaBiometria} from '../screens/auth/TelaBiometria';
import {TabNavigator} from './TabNavigator';
import {Linking} from 'react-native';
const Stack=createNativeStackNavigator();
const linking={prefixes:['uaifrila://','https://uaifrila.com.br'],config:{screens:{Codigo:'validar',Login:'login',Cadastro:'cadastro',App:'app'}}};
export function RootNavigator(){const {usuario,carregando}=useAuth();if(carregando) return null;
 return <NavigationContainer linking={linking}><Stack.Navigator screenOptions={{headerShown:false}}>{usuario?(<Stack.Screen name='App' component={TabNavigator}/>):(<><Stack.Screen name='Inicial' component={TelaInicial}/><Stack.Screen name='Login' component={TelaLogin}/><Stack.Screen name='Codigo' component={TelaCodigo}/><Stack.Screen name='Cadastro' component={TelaCadastro}/><Stack.Screen name='Biometria' component={TelaBiometria}/></>)}</Stack.Navigator></NavigationContainer>;}

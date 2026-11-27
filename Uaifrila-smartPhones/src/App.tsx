import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ThemeProvider} from './context/ThemeContext';
import {AuthProvider} from './context/AuthContext';
import {RootNavigator} from './navigation/RootNavigator';
export default function App(){return <SafeAreaProvider><ThemeProvider><AuthProvider><RootNavigator/></AuthProvider></ThemeProvider></SafeAreaProvider>;}

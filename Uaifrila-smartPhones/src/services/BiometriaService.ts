import ReactNativeBiometrics,{BiometryTypes} from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
const FLAG='uaifrila:biometria-ativa';
const rn=new ReactNativeBiometrics({allowDeviceCredentials:true});
export class BiometriaService{
 static async disponivel(){const {available,biometryType}=await rn.isSensorAvailable();return {available,biometryType};}
 static async estaAtiva(){return (await AsyncStorage.getItem(FLAG))==='1';}
 static async ativar(){const {success}=await rn.simplePrompt({promptMessage:'Confirme para ativar o login por digital / PIN'});if(!success) throw new Error('Biometria não confirmada');await AsyncStorage.setItem(FLAG,'1');}
 static async desativar(){await AsyncStorage.removeItem(FLAG);}
 static async autenticar(){const {success}=await rn.simplePrompt({promptMessage:'Use sua digital ou PIN para entrar no UaiFrila'});if(!success) throw new Error('Autenticação cancelada');const c=await Keychain.getGenericPassword({service:'uaifrila_token'});if(!c) throw new Error('Nenhuma sessão salva. Entre com o código por e-mail.');return c.password;}
}

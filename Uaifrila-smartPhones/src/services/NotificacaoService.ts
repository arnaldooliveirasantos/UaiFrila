import notifee from '@notifee/react-native';
export class NotificacaoService{
 static async pedirPermissao(){await notifee.requestPermission();}
 static async exibir(titulo:string,corpo:string){await notifee.displayNotification({title:titulo,body:corpo,android:{channelId:'uaifrila'}});}
}

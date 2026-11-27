// @ts-ignore — react-native-dotenv opcional; usa variável de build. Sem valor, api.ts lança erro.
export const API_URL: string | undefined = (globalThis as any).__UAIFRILA_API_URL__ ?? process.env.EXPO_PUBLIC_API_URL;

# Uaifrila-smartPhones — React Native CLI (SEM Expo Go) — Android + iOS
## Rodar
1. `npm install`
2. Copiar `.env.example` para `.env` e preencher `EXPO_PUBLIC_API_URL` apontando para a MESMA API do frontend web.
3. Android: `npm run android` (emulador/dispositivo, `adb reverse` se API for localhost) | iOS: `cd ios && pod install && cd .. && npm run ios`
## Regras
- Mesmas APIs do frontend web (`src/services/api.ts` = mesma base, mesmos paths `/api/...`).
- Sem fallback, sem mock: erro da API é exibido na tela. Sem token válido, vai para Login.
- Theme/Styles portados de `uaifrila-frontend/src/styles/Uaifrila.Styles.ts` + `ThemeContext.tsx` para StyleSheet (sem Tailwind no mobile).
- Biometria: `react-native-biometrics` + `react-native-keychain`. Só oferecida APÓS o 1º login com código. O token fica no Keychain/Keystore; a cada abertura chama `GET /api/auth/me`.
- Melhorias implementadas: 1 deep link, 2 biometria+SecureStore+revalidação, 3 leitura do último mural offline (cache AsyncStorage, com aviso), 4 compressão da foto (image-picker quality 0.7 + maxWidth 1024), 5 push (Notifee — registrar token no backend quando endpoint existir), 7 filtro salvo do Mural, 8 acessibilidade (rótulos, contraste, fonte). Item 6 (Publicar de novo / clonar vaga) NÃO implementado, a pedido.
- Android: `android/app/src/main/AndroidManifest.xml` (ver pasta android/) — deep link `uaifrila://`, `USE_BIOMETRIC`, internet. iOS: `ios/UaiFrila/Info.plist` — `NSFaceIDUsageDescription`, URL scheme `uaifrila`.
- Responsivo: SafeArea + `useWindowDimensions` + padding lateral 20 em todas as telas, cards flexíveis, sem texto colado na borda.

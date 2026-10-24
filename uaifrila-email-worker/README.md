# UaiFrila Email Worker v12.2 - Corrigido

## Correções aplicadas:
1. **Pool** ao invés de Client (evita leak)
2. **FOR UPDATE SKIP LOCKED** - evita que 2 workers peguem mesmo e-mail
3. **Limite de tentativas** - após 3 falhas marca como EXPIRADO
4. **Marcação automática de expirados** - expira_em < NOW() vira EXPIRADO
5. **Anti-overlap** - flag isProcessing impede 2 ticks simultâneos
6. **Graceful shutdown** - fecha pool no SIGINT/SIGTERM
7. **Logs detalhados** com messageId

## Rodar:
```bash
cp .env.example .env
npm install
npm run dev
```

Env deve ter:
- DB_USER=email_worker_user (permissões restritas)
- SMTP credenciais Mailtrap / AWS SES / SendGrid

# UaiFrila Database - Ordem de Execução

Execute os scripts na ordem:

1. `00-usuario.sql` - como postgres superuser
2. `01_schema.sql` - estrutura principal
3. `02_data.sql` - dados iniciais (hash bcrypt corrigido)
4. `03_rbac_setup.sql` - roles
5. `04_termo_de_aceite.sql` - estrutura termos
6. `05_tipos_usuarios.sql` - tipos + termos corrigidos
7. `06_sistema_disparo_email_autenticacao.sql` - email system
8. `07_criar_usuario_email_worker.sql` - user email worker
9. `08_fix_avaliacoes_typo.sql` - CORREÇÃO typo avaliado_id

Ou rode tudo:
```bash
psql -U postgres -d uai_frila -f 00-usuario.sql
psql -U uai_frila_app -d uai_frila -f 01_schema.sql
...
```

INSERT INTO tipos_usuario (nome) VALUES ('SUPER_ADMIN'), ('FREELA'), ('CONTRATANTE') ON CONFLICT (nome) DO NOTHING;
INSERT INTO rbac_roles (nome) VALUES ('SUPER_ADMIN'), ('ADMIN_FINANCEIRO'), ('ADMIN_REGIONAL'), ('CONTRATANTE_PREMIUM'), ('CONTRATANTE_PADRAO'), ('FREELA_SUPER'), ('FREELA_PADRAO') ON CONFLICT (nome) DO NOTHING;
INSERT INTO rbac_permissoes (nome, chave) VALUES 
('Visualizar Transações Financeiras','VER_TRANSACOES'), ('Alterar Variáveis','EDITAR_VARIAVEIS'), ('Gerenciar Cidades','GERENCIAR_CIDADES'),
('Publicar Vagas Ilimitado','PUBLICAR_VAGAS_ILIMITADO'), ('Aceitar Candidatos','ACEITAR_CANDIDATOS'), ('Iniciar Ponto','INICIAR_PONTO'),
('Gerenciar Permissões','GERENCIAR_PERMISSOES'), ('Ver Expansão Cidades','VER_EXPANSAO'), ('Ver Código Freela','VER_CODIGO'),
('Chat Freela-Contratante','CHAT'), ('Avaliar Usuários','AVALIAR'), ('Ver Mural','VER_MURAL'), ('Criar Trampo','CRIAR_TRAMPO'),
('Cancelar Vaga','CANCELAR_VAGA'), ('Ver Perfil','VER_PERFIL'), ('Editar Perfil','EDITAR_PERFIL'), ('Upload Selfie','UPLOAD_SELFIE'),
('Ver Bairros','VER_BAIRROS'), ('Ver Pagamentos','VER_PAGAMENTOS'), ('Configurar EFI','CONFIG_EFI'),
('Ver Relatórios','VER_RELATORIOS'), ('Exportar Dados','EXPORTAR_DADOS'), ('Gerenciar Termos','GERENCIAR_TERMOS'),
('Suporte','SUPORTE'), ('Moderar Avaliações','MODERAR_AVALIACOES'), ('Bloquear Usuário','BLOQUEAR_USUARIO')
ON CONFLICT (chave) DO NOTHING;
INSERT INTO variaveis_ambiente (chave, valor, descricao) VALUES
('EMAIL_EXPIRACAO_MINUTOS','5','Expiração código e-mail 5 min'),
('TEMPO_PAGAMENTO_ANTECEDENCIA_MINUTOS','60','Pix 1h antes do serviço'),
('TAXA_INTERMEDIACAO_PERCENTUAL','10','Taxa 10%'),
('TAXA_CARTAO_PERCENTUAL','14','Taxa cartão 14%'),
('TAXA_PIX_PERCENTUAL','10','Taxa Pix 10%'),
('LIMITE_MEI_MENSAL','1500','Limite R$1500 sem MEI'),
('MULTA_CANCELAMENTO','40','Multa R$40 cancelamento <4h')
ON CONFLICT (chave) DO UPDATE SET valor=EXCLUDED.valor;
INSERT INTO email_status (chave, descricao) VALUES ('EM_ESPERA','Aguardando'),('ENVIADO','Enviado'),('VALIDADO','Validado'),('EXPIRADO','Expirado') ON CONFLICT (chave) DO NOTHING;
INSERT INTO email_templates (chave_uso, email_remetente, nome_exibicao, titulo_assunto, conteudo_corpo) VALUES
('CONFIRMACAO_CADASTRO','nao-responda@uaifrila.com.br','UAI FRILA - Cadastro','Ative sua conta','Olá {{NOME}}, seu código é {{CODIGO}}'),
('2FA_LOGIN','seguranca@uaifrila.com.br','UAI FRILA - Segurança','Código 2FA','Seu código é {{CODIGO}} - expira em 5 min')
ON CONFLICT (chave_uso) DO UPDATE SET conteudo_corpo=EXCLUDED.conteudo_corpo;

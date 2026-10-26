"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
class AuthController {
    authService = new AuthService_1.AuthService();
    registrar = async (req, res) => {
        try {
            const result = await this.authService.registrar(req.body);
            if (result.sucesso)
                res.status(201).json(result);
            else
                res.status(200).json(result);
        }
        catch (e) {
            console.error('🔥 ERRO REGISTRAR:', e);
            const status = e.message.includes('já cadastrado') ? 400 : 500;
            res.status(status).json({ erro: e.message });
        }
    };
    login = async (req, res) => {
        try {
            const { email } = req.body;
            const result = await this.authService.login(email);
            res.status(200).json(result);
        }
        catch (e) {
            console.error('🔥 ERRO LOGIN:', e);
            const status = e.message.includes('não encontrado') ? 401 : 500;
            res.status(status).json({ erro: e.message });
        }
    };
    buscarMe = async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ erro: 'Não autenticado' });
                return;
            }
            const usuario = await this.authService.buscarMe(userId);
            res.status(200).json({ usuario });
        }
        catch (e) {
            res.status(404).json({ erro: e.message });
        }
    };
    atualizarUsuario = async (req, res) => {
        try {
            const userIdParam = Number(req.params.id);
            const userIdToken = req.user?.id;
            const nivel = req.user?.nivel_permissao || 0;
            if (userIdParam !== userIdToken && nivel < 80) {
                res.status(403).json({ erro: 'Sem permissão para editar outro usuário' });
                return;
            }
            // Bloqueia CPF e EMAIL explicitamente
            if (req.body.cpf || req.body.email) {
                console.log('🚫 API bloqueou tentativa de atualizar CPF/EMAIL');
                delete req.body.cpf;
                delete req.body.email;
            }
            const usuario = await this.authService.atualizarUsuario(userIdParam, req.body, req.user);
            res.status(200).json({ sucesso: true, usuario });
        }
        catch (e) {
            console.error('Erro atualizar usuario:', e);
            res.status(400).json({ erro: e.message });
        }
    };
    verificarToken2FA = async (req, res) => {
        return this.verificarTokenEmail(req, res);
    };
    listarTiposUsuario = async (req, res) => {
        try {
            const tipos = await this.authService.listarTiposUsuario();
            res.status(200).json({ tipos });
        }
        catch (e) {
            res.status(500).json({ erro: e.message });
        }
    };
    reenviarCodigo = async (req, res) => {
        try {
            const { email, tipo } = req.body;
            const result = await this.authService.reenviarCodigo(email, tipo || 'cadastro');
            res.status(200).json(result);
        }
        catch (e) {
            console.error('🔥 ERRO REENVIAR CODIGO:', e);
            res.status(400).json({ erro: e.message });
        }
    };
    verificarTokenEmail = async (req, res) => {
        try {
            const { email, codigo } = req.body;
            const result = await this.authService.verificarCodigo(email, codigo);
            res.status(200).json(result);
        }
        catch (e) {
            const status = e.message.includes('Código') || e.message.includes('Nenhum código') ? 400 : 500;
            res.status(status).json({ erro: e.message });
        }
    };
}
exports.AuthController = AuthController;

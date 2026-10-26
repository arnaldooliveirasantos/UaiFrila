"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissaoRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class PermissaoRepository extends BaseRepository_1.BaseRepository {
    async buscarRolesComPermissoes() {
        const sql = `
            SELECT r.id as role_id, r.nome as role_nome, 
                   COALESCE(json_agg(p.*) FILTER (WHERE p.id IS NOT NULL), '[]') as permissoes
            FROM rbac_roles r
            LEFT JOIN rbac_role_permissoes rp ON r.id = rp.role_id
            LEFT JOIN rbac_permissoes p ON rp.permissao_id = p.id
            GROUP BY r.id, r.nome ORDER BY r.id
        `;
        return await this.query(sql);
    }
    async sincronizarPermissao(roleId, permissaoId, associar) {
        if (associar) {
            await this.query('INSERT INTO rbac_role_permissoes (role_id, permissao_id) VALUES (\$1, \$2) ON CONFLICT DO NOTHING', [roleId, permissaoId]);
        }
        else {
            await this.query('DELETE FROM rbac_role_permissoes WHERE role_id = \$1 AND permissao_id = \$2', [roleId, permissaoId]);
        }
    }
}
exports.PermissaoRepository = PermissaoRepository;

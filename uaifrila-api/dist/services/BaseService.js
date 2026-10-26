"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
class BaseService {
    handleError(error, context) {
        console.error(`[${context}]`, error.message);
        throw error;
    }
    validateRequired(data, fields) {
        for (const field of fields) {
            if (!data[field]) {
                throw new Error(`Campo obrigatório: ${field}`);
            }
        }
    }
}
exports.BaseService = BaseService;

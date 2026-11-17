#!/usr/bin/env python3
"""Patch 11 — Mural volta a exibir turnos e horários.

Causa: GET /vagas/abertas passa por VagaService.listarMuralParaUsuario, e esse
método nunca anexava os turnos (não consultava vaga_turnos). O MuralVagas.tsx
também não renderizava turnos. O Patch 3 que fazia isso foi apagado quando um
pacote posterior sobrescreveu os arquivos a partir de um snapshot mais antigo.

O que faz (com backup .bak, sem sobrescrever arquivo nenhum):
1. Em uaifrila-api/src/services/VagaService.ts, dentro de listarMuralParaUsuario:
   - carrega os turnos de TODAS as vagas do mural em 1 query só (sem N+1);
   - anexa `turnos: [...]` em cada vaga do resultado.
   Se o método não existir, o script para e pede para rodar o aplicar_patch9.py antes.
2. Nada mais. O MuralVagas.tsx novo vem solto no zip (copiar por cima).

Uso: copie este arquivo para a RAIZ do projeto (onde fica uaifrila-api/) e rode:
    python aplicar_patch11.py
Depois reinicie a API e o front.
"""
import pathlib, re, shutil, sys

ARQ = pathlib.Path("uaifrila-api/src/services/VagaService.ts")

CARGA_TURNOS = """
    // Patch 11: anexa os turnos de cada vaga (1 query só, sem N+1). Sem isso o
    // mural não tem como exibir dias/horários. Falha aqui não derruba o mural:
    // o erro vai para o log e as vagas vêm sem turnos.
    const turnosPorVaga = new Map<number, any[]>();
    if (pool) {
      try {
        const ids = (vagas || []).map((x: any) => Number(x.id)).filter((n: number) => !isNaN(n));
        if (ids.length) {
          const rt = await pool.query(`SELECT vaga_id, data, hora_inicio, hora_fim, valor_servico, valor_transporte FROM vaga_turnos WHERE vaga_id = ANY($1) ORDER BY vaga_id, data, hora_inicio`, [ids]);
          for (const row of (rt.rows || [])) {
            const lista = turnosPorVaga.get(Number(row.vaga_id)) || [];
            lista.push({ data: String(row.data).slice(0, 10), hora_inicio: String(row.hora_inicio).slice(0, 5), hora_fim: String(row.hora_fim).slice(0, 5), valor_servico: Number(row.valor_servico || 0), valor_transporte: Number(row.valor_transporte || 0) });
            turnosPorVaga.set(Number(row.vaga_id), lista);
          }
        }
      } catch (e: any) { console.error('[VagaService] listarMuralParaUsuario: falha ao carregar turnos', e?.message); }
    }
"""

def main():
    if not ARQ.exists():
        print("ERRO: não achei", ARQ, "- rode a partir da raiz do projeto.")
        sys.exit(1)
    t = ARQ.read_text(encoding="utf-8")
    if "listarMuralParaUsuario" not in t:
        print("ERRO: VagaService.ts NÃO tem listarMuralParaUsuario.")
        print("Rode primeiro o aplicar_patch9.py (ele reinsere o método) e depois rode este de novo.")
        sys.exit(1)
    if "turnosPorVaga" in t:
        print("OK: patch 11 já aplicado. Nada a mudar.")
        return
    # Isola o método para não tocar em outro `const result` do arquivo.
    ini = t.find("async listarMuralParaUsuario")
    prox = re.search(r"\n  async \w+", t[ini + 100:])
    fim = ini + 100 + prox.start() if prox else len(t)
    metodo = t[ini:fim]
    if "const result: any[] = [];" not in metodo:
        print("ERRO: não achei o início do loop no método. Não alterei nada.")
        sys.exit(1)
    metodo = metodo.replace("const result: any[] = [];", CARGA_TURNOS + "\n    const result: any[] = [];", 1)
    # Anexa turnos no objeto da vaga. Âncora: linha do valor_servico dentro do push do mural.
    ancora = "valor_servico: v.valor_servico, valor_transporte: v.valor_transporte,"
    if ancora not in metodo:
        print("ERRO: não achei a linha de valor_servico no push do mural. Não alterei nada.")
        sys.exit(1)
    metodo = metodo.replace(ancora, ancora + "\n        turnos: turnosPorVaga.get(Number(v.id)) || [],", 1)
    shutil.copy(ARQ, str(ARQ) + ".bak")
    ARQ.write_text(t[:ini] + metodo + t[fim:], encoding="utf-8")
    print("OK: listarMuralParaUsuario agora devolve turnos por vaga.")
    print("Backup em:", str(ARQ) + ".bak")
    print("Falta copiar o MuralVagas.tsx do zip por cima do seu (ele renderiza os turnos).")

main()

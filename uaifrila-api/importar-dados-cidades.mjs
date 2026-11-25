// =====================================================================
// UAI FRILA - Importar dados oficiais das cidades (codigo_ibge, lat, lng, regiao, populacao)
// VERSÃO: 2026-11-21 - população: SIDRA (períodos descobertos) + Brasil.io
//   O SIDRA falhou em todas as formas (sem classificação, por UF em lotes:
//   sempre 0 municípios; a tabela 6579 não tem classificações). Por isso a
//   população agora tem DUAS fontes, nesta ordem:
//     1) SIDRA, tabela 6579 — variável e PERÍODOS descobertos nos metadados
//        (a última tentativa usava período 2022 fixo; pode não existir);
//     2) Brasil.io, dataset "populacao" (dados do IBGE, download público,
//        sem token): CSV com um registro por município por ano — o script
//        fica com o ANO MAIS RECENTE de cada município.
//   Se as duas falharem, o import NÃO trava: grava todo o resto e avisa
//   em destaque que populacao ficou NULL, com o passo manual.
//   --populacao-arquivo tem precedência sobre as duas e aceita 2 formatos:
//   o simples (codigo_ibge,populacao) e o export nativo do SIDRA.
//
// Fontes:
//   1) https://github.com/kelvins/municipios-brasileiros (json/municipios.json)
//      dados derivados do IBGE: codigo_ibge, nome, codigo_uf, latitude, longitude.
//      NÃO tem regiao nem populacao — por isso esses dois campos ficavam NULL.
//   2) https://servicodados.ibge.gov.br/api/v1/localidades/municipios
//      -> regiao = microrregiao.mesorregiao.nome (ex.: "Triângulo Mineiro/Alto Paranaíba").
//
// O QUE FAZ:
//   - Baixa as bases oficiais e casa cada item com cidades (nome + UF), sem acento.
//   - Preenche SOMENTE campos que estão NULL (não sobrescreve as 5 cidades curadas).
//   - Loga quantos casaram e lista os que NÃO casaram (para corrigir na mão).
//
// O QUE NÃO FAZ (de propósito):
//   - NÃO inventa coordenada, IBGE, região ou população.
//   - NÃO usa fallback de dados: se uma fonte de população falhar, o campo fica
//     NULL e o log diz exatamente como preencher — nunca um número inventado.
//   - NÃO apaga duplicata sozinho: se houver colisão, aborta ANTES de qualquer
//     UPDATE e mostra as linhas exatas (rode 00-DEDUP-CIDADES.sql).
//
// CONEXÃO (igual ao Database.ts da API):
//   Lê o .env ao lado deste script. Aceita DATABASE_URL válida OU
//   DB_USER/DB_PASSWORD/DB_HOST/DB_PORT/DB_NAME. Se a DATABASE_URL vier com
//   'undefined' (placeholder), ela é ignorada e a conexão é montada das partes.
//   A senha vai com encodeURIComponent (o .env do projeto tem @ e ! na senha).
//
// POPULAÇÃO via arquivo próprio (opcional, tem precedência sobre tudo):
//   Baixe em https://sidra.ibge.gov.br/tabela/6579 (exportar CSV) e rode:
//     node importar-dados-cidades.mjs --populacao-arquivo sidra-6579.csv
//   Aceita o CSV exportado pelo SIDRA (colunas "Município (Código)" e "Valor")
//   ou o simples codigo_ibge,populacao. JSON com { codigo_ibge, populacao }
//   também vale.
//
// COMO RODAR (dentro de uaifrila-api, onde o pacote `pg` já existe):
//   node importar-dados-cidades.mjs
//   node importar-dados-cidades.mjs --dry-run
//   node importar-dados-cidades.mjs --uf MG,GO
// =====================================================================
import pg from 'pg';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const FONTE = 'https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json';
const FONTE_REGIOES = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const FONTE_SIDRA_METADADOS = 'https://servicodados.ibge.gov.br/api/v3/agregados/6579/metadados';
const FONTE_SIDRA_BASE = 'https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos';
const FONTE_BRASILIO_POPULACAO = 'https://data.brasil.io/dataset/populacao/data.csv';
const UFS_PADRAO = ['MG', 'GO', 'SP', 'RJ', 'ES'];

// codigo_uf (IBGE) -> sigla. O JSON oficial NÃO tem campo 'uf' — ele traz
// 'codigo_uf'. É daqui que a UF de cada município é derivada.
const UF_POR_CODIGO = {
  11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
  21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL',
  28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR',
  42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF',
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
// Lê o valor de uma flag SOMENTE se ela existir e o próximo arg não for outra
// flag. Sem isso, `indexOf('--uf')` retornava -1 e o código lia args[0]
// ('--dry-run') como se fosse o valor de --uf — e o filtro virava
// sigla = '--DRY-RUN', retornando 0 cidades mesmo com 1900+ no banco.
const valorDe = (flag) => {
  const i = args.indexOf(flag);
  if (i === -1 || i + 1 >= args.length) return null;
  const v = args[i + 1];
  if (v.startsWith('--')) return null;
  return v;
};
const ufArg = valorDe('--uf');
const ufs = ufArg ? ufArg.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) : UFS_PADRAO;
const popArquivo = valorDe('--populacao-arquivo');

// ---- Conexão: lê o .env ao lado deste script (não depende do cwd) ----
function carregarEnv() {
  const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const linha of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
carregarEnv();

function montarConnectionString() {
  const url = process.env.DATABASE_URL;
  if (url && url.trim() && !/undefined/.test(url)) {
    try {
      const u = new URL(url.trim());
      if (u.username && u.username !== 'undefined') return url.trim();
    } catch { /* cai para as partes do .env */ }
  }
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME;
  if (!user || !password || !db || user === 'undefined' || password === 'undefined' || db === 'undefined') {
    throw new Error("Conexão não configurada: no .env (uaifrila-api/.env) defina uma DATABASE_URL válida OU DB_USER / DB_PASSWORD / DB_NAME com valores reais — foi encontrado 'undefined'.");
  }
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}
const DATABASE_URL = montarConnectionString();
console.log('[importar-dados-cidades] Conectando com:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Mesmo normalizar do match: sem acento, maiúsculo. É ESSA a chave que decide
// qual cidade recebe qual codigo_ibge — por isso a detecção de colisão usa
// ela também, e não o LOWER() do SQL (que não tira acento e deixava
// 'Patrocínio' x 'Patrocinio' passar como se fossem cidades diferentes).
const normalizar = (s) =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

// UF de um item da base oficial: campo 'uf' se existir, senão via 'codigo_uf'.
const ufDoItem = (item) => {
  if (item.uf) return String(item.uf).toUpperCase();
  if (item.codigo_uf != null) return UF_POR_CODIGO[Number(item.codigo_uf)] ?? null;
  if (item.estado?.uf) return String(item.estado.uf).toUpperCase();
  return null;
};

// User-Agent explícito: algumas APIs do IBGE devolvem vazio para cliente sem ele.
async function baixarJson(url, descricao) {
  const r = await fetch(url, { headers: { 'User-Agent': 'UaiFrila-import/1.0' } });
  if (!r.ok) throw new Error(`Falha ao baixar ${descricao} (${url}): HTTP ${r.status}`);
  return r.json();
}

async function baixarTexto(url, descricao) {
  const r = await fetch(url, { headers: { 'User-Agent': 'UaiFrila-import/1.0' } });
  if (!r.ok) throw new Error(`Falha ao baixar ${descricao} (${url}): HTTP ${r.status}`);
  return r.text();
}

// Separa uma linha CSV respeitando aspas ("a;b";"c" não quebra no ; dentro das aspas).
function separarCsv(linha) {
  const partes = [];
  let atual = '', emAspas = false;
  for (const ch of linha) {
    if (ch === '"') { emAspas = !emAspas; continue; }
    if ((ch === ';' || ch === ',') && !emAspas) { partes.push(atual); atual = ''; continue; }
    atual += ch;
  }
  partes.push(atual);
  return partes.map((p) => p.trim());
}

// Soma as séries por município em TODOS os resultados, com uma regra contra
// dupla contagem: se algum resultado for a categoria "Total", usa SÓ ele
// (algumas tabelas devolvem Total + as partes; somar tudo contaria 2x).
// Sem resultado Total, soma as partes (ex.: homem + mulher = total).
function somarSeriesSidra(dados) {
  const mapa = new Map();
  for (const item of dados ?? []) {
    const resultados = item.resultados ?? [];
    const comTotal = resultados.filter((r) =>
      (r.classificacoes ?? []).some((c) => /^\s*total\s*$/i.test(c.categoria?.nome ?? c.categoria?.name ?? '')),
    );
    const usar = comTotal.length > 0 ? comTotal : resultados;
    for (const res of usar) {
      for (const s of res.series ?? []) {
        const ibge = String(s.localidade?.id ?? '');
        const valor = Number(s.serie?.['2022']);
        if (ibge && Number.isFinite(valor)) mapa.set(ibge, (mapa.get(ibge) ?? 0) + valor);
      }
    }
  }
  return mapa;
}

function dividirLotes(lista, tamanho) {
  const lotes = [];
  for (let i = 0; i < lista.length; i += tamanho) lotes.push(lista.slice(i, i + tamanho));
  return lotes;
}

// Descobre os períodos disponíveis nos metadados (array de { id } ou de
// strings). Se não vier, usa ['2022'] como antes.
function periodosDoMetadado(meta) {
  const lista = meta?.periodos ?? meta?.periods ?? [];
  const ids = lista.map((p) => String(p?.id ?? p)).filter((s) => /^\d{4}$/.test(s));
  if (ids.length === 0) return ['2022'];
  return [...new Set(ids)].sort((a, b) => Number(b) - Number(a)).slice(0, 3);
}

// População via SIDRA. NÃO chuta códigos: lê os metadados da tabela 6579 e
// descobre a variável "População residente", as classificações e os períodos.
// Tenta, para cada período descoberto (mais recente primeiro):
//   a) sem classificação, N6[all];
//   b) primeira classificação com [all], N6[all] (se houver classificação);
//   c) igual a (b), mas por UF em lotes de 500 códigos.
// Se tudo falhar, retorna null — o chamador tenta o Brasil.io. Nenhum número
// é inventado.
async function buscarPopulacaoSidra(codigosPorUf) {
  let meta;
  try {
    meta = await baixarJson(FONTE_SIDRA_METADADOS, 'metadados SIDRA 6579');
  } catch (e) {
    console.warn(`[importar-dados-cidades] AVISO: não consegui ler os metadados do SIDRA (${e.message}).`);
    return null;
  }
  const variaveis = meta?.variaveis ?? meta?.variables ?? [];
  const variavel = variaveis.find((v) => /popula/i.test(v.nome ?? v.name ?? '')) ?? variaveis[0];
  if (variavel?.id == null) {
    console.warn(`[importar-dados-cidades] AVISO: metadados do SIDRA sem variável de população reconhecida: ${JSON.stringify(meta).slice(0, 300)}`);
    return null;
  }
  const classificacoes = meta?.classificacoes ?? meta?.classifications ?? [];
  const primeiraClass = classificacoes[0];
  const classAll = primeiraClass?.id != null ? `&classificacao=${primeiraClass.id}[all]` : '';
  const periodos = periodosDoMetadado(meta);
  console.log(`[importar-dados-cidades] SIDRA: variável ${variavel.id} (${variavel.nome ?? variavel.name})${primeiraClass ? `, classificação ${primeiraClass.id} (${primeiraClass.nome ?? primeiraClass.name})` : ', sem classificações na tabela'}, períodos: ${periodos.join(', ')}`);

  const tentar = async (descricao, url, periodo) => {
    let dados;
    try {
      dados = await baixarJson(url, `população SIDRA (${descricao})`);
    } catch (e) {
      console.warn(`[importar-dados-cidades] AVISO: SIDRA falhou em "${descricao}" (${e.message}).`);
      return null;
    }
    const mapa = somarSeriesSidra(dados);
    console.log(`[importar-dados-cidades] SIDRA "${descricao}": ${mapa.size} municípios.`);
    return mapa.size > 0 ? mapa : null;
  };

  for (const periodo of periodos) {
    const baseUrl = `${FONTE_SIDRA_BASE}/${periodo}/variaveis/${variavel.id}`;
    const mapaA = await tentar(`período ${periodo}, sem classificação, N6[all]`, `${baseUrl}?localidades=N6[all]`, periodo);
    if (mapaA) return { mapa: mapaA, url: `SIDRA período ${periodo}, sem classificação` };
    if (classAll) {
      const mapaB = await tentar(`período ${periodo}, classificação [all], N6[all]`, `${baseUrl}?localidades=N6[all]${classAll}`, periodo);
      if (mapaB) return { mapa: mapaB, url: `SIDRA período ${periodo}, classificação [all]` };
    }
    const mapaC = new Map();
    for (const [uf, codigos] of codigosPorUf) {
      for (const lote of dividirLotes(codigos, 500)) {
        const mapaLote = await tentar(`período ${periodo}, UF ${uf}, lote de ${lote.length}`, `${baseUrl}?localidades=N6[${lote.join(',')}]${classAll}`, periodo);
        if (mapaLote) for (const [k, v] of mapaLote) mapaC.set(k, (mapaC.get(k) ?? 0) + v);
      }
    }
    if (mapaC.size > 0) return { mapa: mapaC, url: `SIDRA período ${periodo}, por UF em lotes` };
  }
  console.warn('[importar-dados-cidades] AVISO: SIDRA não retornou população em nenhuma das formas.');
  return null;
}

// População via Brasil.io (dataset "populacao", dados do IBGE, download
// público sem token). O CSV tem um registro por município por ano; fica-se
// com o ANO MAIS RECENTE de cada município. O cabeçalho é descoberto por
// nome de coluna (aceita variações), e se não for reconhecido o script loga
// o cabeçalho real e retorna null — sem inventar nada.
async function buscarPopulacaoBrasilIO() {
  let texto;
  try {
    texto = await baixarTexto(FONTE_BRASILIO_POPULACAO, 'população Brasil.io');
  } catch (e) {
    console.warn(`[importar-dados-cidades] AVISO: Brasil.io falhou (${e.message}).`);
    return null;
  }
  const linhas = texto.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (linhas.length === 0) {
    console.warn('[importar-dados-cidades] AVISO: Brasil.io retornou arquivo vazio.');
    return null;
  }
  const cabecalho = separarCsv(linhas[0]).map((h) => h.toLowerCase());
  const iCodigo = cabecalho.findIndex((h) => h.includes('codigo') && (h.includes('municipio') || h.includes('município') || h.includes('ibge')));
  const iValor = cabecalho.findIndex((h) => h === 'populacao' || h === 'população' || h === 'populacao_estimada' || h === 'população_estimada');
  const iAno = cabecalho.findIndex((h) => h === 'ano' || h === 'year');
  if (iCodigo === -1 || iValor === -1) {
    console.warn(`[importar-dados-cidades] AVISO: Brasil.io com colunas não reconhecidas. Cabeçalho: ${linhas[0]}`);
    return null;
  }
  const porCodigo = new Map();
  for (const linha of linhas.slice(1)) {
    const colunas = separarCsv(linha);
    const codigo = (colunas[iCodigo] ?? '').replace(/\D/g, '');
    const valor = Number(String(colunas[iValor] ?? '').replace(/\./g, '').replace(',', '.'));
    const ano = iAno === -1 ? 0 : Number(colunas[iAno] ?? 0);
    if (!codigo || !Number.isFinite(valor)) continue;
    const atual = porCodigo.get(codigo);
    if (!atual || ano >= atual.ano) porCodigo.set(codigo, { ano, valor });
  }
  const mapa = new Map([...porCodigo.entries()].map(([k, v]) => [k, v.valor]));
  const anos = [...porCodigo.values()].map((v) => v.ano);
  console.log(`[importar-dados-cidades] Brasil.io: ${mapa.size} municípios, ano mais recente: ${anos.length ? Math.max(...anos) : '?'}.`);
  return mapa.size > 0 ? mapa : null;
}

// Lê população de arquivo. Aceita:
//   - JSON: [{ codigo_ibge, populacao }]
//   - CSV simples: codigo_ibge,populacao
//   - CSV exportado pelo SIDRA: colunas "Município (Código)" e "Valor"
//     (separador ; ou ,, aspas opcionais, milhar com ponto: "713.232").
function carregarPopulacaoArquivo(caminho) {
  const bruto = fs.readFileSync(caminho, 'utf8').replace(/^\uFEFF/, '');
  if (caminho.endsWith('.json')) {
    const mapa = new Map();
    for (const r of JSON.parse(bruto)) mapa.set(String(r.codigo_ibge), Number(r.populacao));
    return mapa;
  }
  const linhas = bruto.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (linhas.length === 0) throw new Error(`Arquivo de população vazio: ${caminho}`);
  const cabecalho = separarCsv(linhas[0]).map((h) => h.toLowerCase());
  const indiceCodigo = cabecalho.findIndex((h) => h.includes('codigo_ibge') || (h.includes('município') && h.includes('código')));
  const indiceValor = cabecalho.findIndex((h) => h === 'populacao' || h === 'população' || h === 'valor');
  if (indiceCodigo === -1 || indiceValor === -1) {
    throw new Error(`CSV de população sem colunas reconhecidas. Cabeçalho: ${linhas[0]}. Use codigo_ibge,populacao ou o export do SIDRA (colunas "Município (Código)" e "Valor").`);
  }
  const mapa = new Map();
  for (const linha of linhas.slice(1)) {
    const colunas = separarCsv(linha);
    const codigo = (colunas[indiceCodigo] ?? '').replace(/\D/g, '');
    const valor = Number(String(colunas[indiceValor] ?? '').replace(/\./g, '').replace(',', '.'));
    if (codigo && Number.isFinite(valor)) mapa.set(codigo, valor);
  }
  return mapa;
}

const base = await baixarJson(FONTE, 'base oficial de municípios');
if (!Array.isArray(base) || base.length === 0) throw new Error('Formato inesperado: esperado array de municípios.');
const primeiro = base[0];
for (const campo of ['codigo_ibge', 'nome', 'latitude', 'longitude']) {
  if (!(campo in primeiro)) {
    throw new Error(`Formato inesperado: campo '${campo}' ausente na base oficial. Campos encontrados: ${Object.keys(primeiro).join(', ')}`);
  }
}
if (!('uf' in primeiro) && !('codigo_uf' in primeiro)) {
  throw new Error(`Formato inesperado: nem 'uf' nem 'codigo_uf' na base oficial. Campos encontrados: ${Object.keys(primeiro).join(', ')}`);
}

const porChave = new Map();
const codigosPorUf = new Map();
for (const item of base) {
  const uf = ufDoItem(item);
  if (!uf || !ufs.includes(uf)) continue;
  porChave.set(`${normalizar(item.nome)}|${uf}`, item);
  if (!codigosPorUf.has(uf)) codigosPorUf.set(uf, []);
  codigosPorUf.get(uf).push(String(item.codigo_ibge));
}

// regiao = mesorregião do IBGE (API de localidades). A base do GitHub não tem
// esse campo — era por isso que regiao ficava NULL.
const localidades = await baixarJson(FONTE_REGIOES, 'regiões do IBGE (localidades)');
if (!Array.isArray(localidades) || localidades.length === 0) throw new Error('Formato inesperado: esperado array de localidades do IBGE.');
const regiaoPorIbge = new Map();
for (const loc of localidades) {
  const meso = loc.microrregiao?.mesorregiao?.nome;
  if (loc.id == null || !meso) continue;
  regiaoPorIbge.set(String(loc.id), String(meso));
}
if (regiaoPorIbge.size === 0) throw new Error('Formato inesperado: nenhum item de localidades trouxe microrregiao.mesorregiao.nome.');

// populacao: arquivo tem precedência; senão SIDRA; senão Brasil.io;
// se tudo falhar, segue sem populacao (aviso no log) — o resto não trava.
const populacaoPorIbge = new Map();
let fontePopulacao = null;
if (popArquivo) {
  const mapa = carregarPopulacaoArquivo(popArquivo);
  for (const [k, v] of mapa) populacaoPorIbge.set(k, v);
  fontePopulacao = `arquivo ${popArquivo}`;
} else {
  const sidra = await buscarPopulacaoSidra(codigosPorUf);
  if (sidra) {
    for (const [k, v] of sidra.mapa) populacaoPorIbge.set(k, v);
    fontePopulacao = `SIDRA (${sidra.url})`;
  } else {
    const brasilIO = await buscarPopulacaoBrasilIO();
    if (brasilIO) {
      for (const [k, v] of brasilIO) populacaoPorIbge.set(k, v);
      fontePopulacao = 'Brasil.io (dados do IBGE, ano mais recente)';
    } else {
      console.warn('[importar-dados-cidades] AVISO: SIDRA e Brasil.io não retornaram população. populacao ficará NULL. Para preencher depois, baixe o CSV em https://sidra.ibge.gov.br/tabela/6579 e rode: node importar-dados-cidades.mjs --populacao-arquivo sidra-6579.csv');
    }
  }
}
console.log(`[importar-dados-cidades] Regiões (mesorregião IBGE): ${regiaoPorIbge.size} | População: ${fontePopulacao ?? 'NÃO PREENCHIDA (ver avisos acima)'}`);

const pool = new pg.Pool({ connectionString: DATABASE_URL });
try {
  // Pré-checagem 1: colunas. Se o banco real estiver sem alguma coluna, o erro
  // do Postgres ("column ... does not exist") não diz qual. Aqui diz exatamente
  // qual falta e qual ALTER roda para criar — antes de qualquer UPDATE.
  const colunasEsperadas = {
    cidades: ['id', 'nome', 'codigo_ibge', 'lat', 'lng', 'regiao', 'populacao', 'estado_id'],
    estados: ['id', 'sigla'],
  };
  const { rows: colunas } = await pool.query(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [Object.keys(colunasEsperadas)],
  );
  const tem = new Set(colunas.map((r) => `${r.table_name}.${r.column_name}`));
  const faltando = [];
  for (const [tabela, lista] of Object.entries(colunasEsperadas)) {
    for (const col of lista) if (!tem.has(`${tabela}.${col}`)) faltando.push(`${tabela}.${col}`);
  }
  if (faltando.length) {
    const alters = {
      'cidades.codigo_ibge': "ALTER TABLE cidades ADD COLUMN codigo_ibge VARCHAR(10);",
      'cidades.lat': "ALTER TABLE cidades ADD COLUMN lat NUMERIC(10,7);",
      'cidades.lng': "ALTER TABLE cidades ADD COLUMN lng NUMERIC(10,7);",
      'cidades.regiao': "ALTER TABLE cidades ADD COLUMN regiao VARCHAR(100);",
      'cidades.populacao': "ALTER TABLE cidades ADD COLUMN populacao INTEGER;",
      'cidades.estado_id': "ALTER TABLE cidades ADD COLUMN estado_id INTEGER NOT NULL REFERENCES estados(id);",
    };
    throw new Error(
      `Banco sem as colunas: ${faltando.join(', ')}. Rode no psql:\n` +
      faltando.map((f) => alters[f] ?? `-- coluna ${f} sem ALTER automático: confira o DDL`).join('\n'),
    );
  }
  // Pré-checagem 2: sigla duplicada em estados. Se 'MG' existir 2x, o JOIN
  // abaixo devolve cada cidade mineira 2x e o segundo UPDATE da mesma linha
  // colide consigo mesmo em uq_cidades_codigo_ibge.
  const { rows: siglasDup } = await pool.query(
    `SELECT sigla, COUNT(*) AS qtd, STRING_AGG(id::text, ', ' ORDER BY id) AS ids
     FROM estados GROUP BY sigla HAVING COUNT(*) > 1 ORDER BY sigla`,
  );
  if (siglasDup.length) {
    const lista = siglasDup.map((d) => `  - ${d.sigla} (${d.qtd}x, ids: ${d.ids})`).join('\n');
    throw new Error(
      `Siglas duplicadas em estados (${siglasDup.length}):\n${lista}\n` +
      `Rode o bloco "estados duplicados" de 00-DEDUP-CIDADES.sql (aponta as cidades para um id só e apaga o outro) e rode o import de novo.`,
    );
  }
  const { rows: cidades } = await pool.query(
    `SELECT c.id, c.nome, c.codigo_ibge, c.lat, c.lng, c.regiao, c.populacao, e.sigla AS uf
     FROM cidades c JOIN estados e ON e.id = c.estado_id WHERE e.sigla = ANY($1)`,
    [ufs],
  );
  // Pré-checagem 3: colisão ANTES de qualquer UPDATE. Simula o mapeamento
  // inteiro em memória com a MESMA chave do match (nome sem acento + UF).
  // Duas frentes, porque nenhuma sozinha cobre tudo:
  //   3a) duas linhas diferentes receberiam o MESMO codigo_ibge
  //       (ex.: 'Patrocínio' x 'Patrocinio' — o dedup por nome não vê);
  //   3b) uma linha receberia um codigo_ibge que JÁ EXISTE em outra linha
  //       QUALQUER da tabela — inclusive fora das 5 UFs, com estado_id NULL
  //       ou com nome que não casa com a base oficial (ex.: 'Patrocínio - MG').
  //       A checagem 3a não vê esse caso, porque a linha dona do código
  //       nem entra no grupo. A constraint única é da tabela inteira, então
  //       a checagem tem que ser da tabela inteira também: sem JOIN, sem UF.
  const porCodigoAlvo = new Map();
  for (const c of cidades) {
    const item = porChave.get(`${normalizar(c.nome)}|${c.uf}`);
    if (!item) continue;
    const alvo = String(item.codigo_ibge);
    if (!porCodigoAlvo.has(alvo)) porCodigoAlvo.set(alvo, []);
    porCodigoAlvo.get(alvo).push(c);
  }
  const colisoes3a = [...porCodigoAlvo.entries()]
    .filter(([, lista]) => new Set(lista.map((c) => c.id)).size >= 2)
    .map(([alvo, lista]) => ({
      alvo,
      jaTem: lista.filter((c) => String(c.codigo_ibge) === alvo),
      receberiam: lista.filter((c) => !c.codigo_ibge),
      todas: lista,
    }))
    .filter((col) => (col.jaTem.length > 0 ? col.receberiam.length > 0 : col.receberiam.length > 1));
  const { rows: codigosExistentes } = await pool.query(
    `SELECT codigo_ibge FROM cidades WHERE codigo_ibge IS NOT NULL`,
  );
  const codigosJaUsados = new Set(codigosExistentes.map((r) => String(r.codigo_ibge)));
  const colisoes3b = [];
  for (const [alvo, lista] of porCodigoAlvo) {
    const receberiam = lista.filter((c) => !c.codigo_ibge);
    if (receberiam.length === 0) continue;
    if (!codigosJaUsados.has(alvo)) continue;
    const { rows: donos } = await pool.query(
      `SELECT id, nome, codigo_ibge, estado_id FROM cidades WHERE codigo_ibge = $1`,
      [alvo],
    );
    colisoes3b.push({ alvo, receberiam, donos });
  }
  if (colisoes3a.length || colisoes3b.length) {
    const linhas3a = colisoes3a.map((col) => {
      const linhas = col.todas.map((c) => `id=${c.id} nome='${c.nome}'/${c.uf} codigo_ibge=${c.codigo_ibge ?? 'NULL'}`).join(' | ');
      return `  - [duas linhas receberiam] codigo_ibge ${col.alvo}: ${linhas}`;
    });
    const linhas3b = colisoes3b.map((col) => {
      const quem = col.receberiam.map((c) => `id=${c.id} nome='${c.nome}'/${c.uf}`).join(' | ');
      const donos = col.donos.map((d) => `id=${d.id} nome='${d.nome}' estado_id=${d.estado_id}`).join(' | ');
      return `  - [código já existe] codigo_ibge ${col.alvo}: receberia -> ${quem} || dono atual -> ${donos}`;
    });
    throw new Error(
      `Colisão de codigo_ibge — abortei antes de qualquer UPDATE:\n${[...linhas3a, ...linhas3b].join('\n')}\n` +
      `Rode 00-DEDUP-CIDADES.sql no psql (bloco 0 mostra o dono do código; o DELETE mantém a linha com codigo_ibge preenchido, senão a de menor id) e rode o import de novo.`,
    );
  }
  let atualizadas = 0, jaPreenchidas = 0;
  const semMatch = [];
  for (const c of cidades) {
    const item = porChave.get(`${normalizar(c.nome)}|${c.uf}`);
    if (!item) { semMatch.push(`${c.nome}/${c.uf}`); continue; }
    const codigoIbge = String(item.codigo_ibge);
    const updates = {};
    if (!c.codigo_ibge) updates.codigo_ibge = codigoIbge;
    if (c.lat == null) updates.lat = Number(item.latitude);
    if (c.lng == null) updates.lng = Number(item.longitude);
    if (!c.regiao && regiaoPorIbge.has(codigoIbge)) updates.regiao = regiaoPorIbge.get(codigoIbge);
    if (c.populacao == null && populacaoPorIbge.has(codigoIbge)) updates.populacao = populacaoPorIbge.get(codigoIbge);
    if (Object.keys(updates).length === 0) { jaPreenchidas++; continue; }
    if (dryRun) { atualizadas++; continue; }
    const sets = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ');
    await pool.query(`UPDATE cidades SET ${sets} WHERE id = $1`, [c.id, ...Object.values(updates)]);
    atualizadas++;
  }
  console.log(`Cidades no banco (${ufs.join(',')}): ${cidades.length}`);
  console.log(dryRun ? `(dry-run) Seriam atualizadas: ${atualizadas}` : `Atualizadas: ${atualizadas}`);
  console.log(`Já preenchidas: ${jaPreenchidas}`);
  console.log(`Sem match na base oficial (${semMatch.length}):`, semMatch.length ? semMatch.join(', ') : 'nenhuma');
  if (!fontePopulacao) console.log('População NÃO preenchida: baixe o CSV em https://sidra.ibge.gov.br/tabela/6579 e rode com --populacao-arquivo sidra-6579.csv');
} finally {
  await pool.end();
}

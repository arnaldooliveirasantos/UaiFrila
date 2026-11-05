import 'reflect-metadata';

const HIDDEN_KEY = Symbol('hidden_fields');
const COLUMNS_KEY = Symbol('columns');
const RELATIONS_KEY = Symbol('relations');

export type MaskType = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'codigo' | 'custom';

export interface ColumnOptions {
  name?: string;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  description?: string;
  hidden?: boolean;
  sensitive?: boolean;
  mask?: MaskType;
  maskCustom?: (value: any) => any;
  type?: string;
  nullable?: boolean;
  default?: any;
}

export interface RelationMeta {
  property: string;
  foreignKey: string;
  target: () => any;
  type: 'belongsTo' | 'hasMany' | 'hasOne';
  alias?: string;
  description?: string;
}

// FIX TS1240: retorno any e assinatura compatível com TS5
export function Hidden(description?: string): any {
  return function (target: any, propertyKey: string | symbol): void {
    if (!target) return;
    const ctor = target.constructor as any;
    if (!ctor[HIDDEN_KEY]) ctor[HIDDEN_KEY] = new Set<string>();
    ctor[HIDDEN_KEY].add(propertyKey as string);
    if (!ctor[COLUMNS_KEY]) ctor[COLUMNS_KEY] = {};
    if (!ctor[COLUMNS_KEY][propertyKey as string]) ctor[COLUMNS_KEY][propertyKey as string] = {};
    ctor[COLUMNS_KEY][propertyKey as string].hidden = true;
    if (description) ctor[COLUMNS_KEY][propertyKey as string].description = description;
  };
}

export function Column(optionsOrName?: string | ColumnOptions): any {
  return function (target: any, propertyKey: string | symbol): void {
    if (!target) return;
    const ctor = target.constructor as any;
    if (!ctor[COLUMNS_KEY]) ctor[COLUMNS_KEY] = {};
    let opts: ColumnOptions = {};
    if (typeof optionsOrName === 'string') opts = { name: optionsOrName };
    else if (typeof optionsOrName === 'object') opts = optionsOrName as ColumnOptions;
    else opts = { name: propertyKey as string };
    if (!opts.name) opts.name = propertyKey as string;
    ctor[COLUMNS_KEY][propertyKey as string] = { ...ctor[COLUMNS_KEY][propertyKey as string], ...opts };
    if (opts.hidden) {
      if (!ctor[HIDDEN_KEY]) ctor[HIDDEN_KEY] = new Set<string>();
      ctor[HIDDEN_KEY].add(propertyKey as string);
    }
    if (opts.primaryKey) ctor.__primaryKey = propertyKey as string;
  };
}

export function BelongsTo(targetModel: () => any, foreignKey: string, options?: { description?: string, alias?: string }): any {
  return function (target: any, propertyKey: string | symbol): void {
    if (!target) return;
    const ctor = target.constructor as any;
    if (!ctor[RELATIONS_KEY]) ctor[RELATIONS_KEY] = [];
    ctor[RELATIONS_KEY].push({ property: propertyKey as string, foreignKey, target: targetModel, type: 'belongsTo', alias: options?.alias || propertyKey as string, description: options?.description } as RelationMeta);
  };
}

export function HasMany(targetModel: () => any, foreignKey: string, options?: { description?: string }): any {
  return function (target: any, propertyKey: string | symbol): void {
    if (!target) return;
    const ctor = target.constructor as any;
    if (!ctor[RELATIONS_KEY]) ctor[RELATIONS_KEY] = [];
    ctor[RELATIONS_KEY].push({ property: propertyKey as string, foreignKey, target: targetModel, type: 'hasMany', description: options?.description } as RelationMeta);
  };
}

export abstract class BaseModel {
  static tableName: string = '';
  static primaryKey: string = 'id';
  constructor(data?: any) { if (data) this.fill(data); }
  fill(data: any) {
    if (!data) return;
    const columns = (this.constructor as any)[COLUMNS_KEY] || {};
    const columnToProp: Record<string, string> = {};
    Object.keys(columns).forEach(prop => {
      const colName = columns[prop].name || prop;
      columnToProp[colName] = prop;
      columnToProp[prop] = prop;
    });
    Object.keys(data).forEach(dbKey => {
      const prop = columnToProp[dbKey];
      if (prop) (this as any)[prop] = data[dbKey];
      else {
        const camel = dbKey.replace(/_([a-z])/g, (_: any, letter: string) => letter.toUpperCase());
        (this as any)[camel] = data[dbKey];
        (this as any)[dbKey] = data[dbKey];
      }
    });
  }
  static getColumns(): Record<string, ColumnOptions> { return (this as any)[COLUMNS_KEY] || {}; }
  static getRelations(): RelationMeta[] { return (this as any)[RELATIONS_KEY] || []; }
  toJSON(options?: { unmasked?: boolean }): any {
    const hidden = (this.constructor as any)[HIDDEN_KEY] || new Set<string>();
    const columns = (this.constructor as any)[COLUMNS_KEY] || {};
    const obj: any = {};
    Object.keys(columns).forEach(prop => {
      if (hidden.has(prop)) return;
      const colOpts = columns[prop] as ColumnOptions;
      let value = (this as any)[prop];
      if (colOpts.sensitive && !options?.unmasked) {
        if (value) {
          switch(colOpts.mask){
            case 'cpf': value = value.replace(/.(?=.{4})/g,'*'); break;
            case 'cnpj': value = value.replace(/.(?=.{4})/g,'*'); break;
            case 'email': { const p=value.split('@'); value=p[0][0]+'***@'+p[1]; break; }
            case 'codigo': value = value[0]+'***'+value[value.length-1]; break;
            default: value='***';
          }
        }
      }
      if (value instanceof BaseModel) obj[prop] = value.toJSON(options);
      else if (Array.isArray(value) && value[0] instanceof BaseModel) obj[prop] = value.map((v: any) => v.toJSON(options));
      else obj[prop] = value;
    });
    return obj;
  }
  toPublic(viewerId?: number, isAdmin?: boolean): any { return this.toJSON({ unmasked: false }); }
  toUnmasked(): any { return this.toJSON({ unmasked: true }); }
  toRaw(): any { const obj: any = {}; Object.keys(this).forEach(k => obj[k] = (this as any)[k]); return obj; }
}

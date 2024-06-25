

export interface iBusinessDatabaseData {
    id?:number
    businessID?:number
    schemaName?:string
    status?:string
    createdAt?:string
}

export type iBusinessDatabaseUpdatableColumns = 'schemaName'|'status'
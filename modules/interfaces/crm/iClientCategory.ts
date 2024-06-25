

export interface iClientCategoryTable {
    id?:number
    name?:string
    description?:string
    color?:string
    dependency?:number
    sessionID?:number|string|null
    status?:string
    createdAt?:string
}

export type iClientCategoryUpdatableColumns = 'name' | 'description' | 'color' | 'status'|'sessionID'
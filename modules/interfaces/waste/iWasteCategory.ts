

export interface iWasteCategoryTable {
    id?:number
    name?:string
    dependency?:number
    color?:string
    description?:string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iWasteCategoryTableUpdatableColumns = 'name'|'dependency'|'color'|'description'|'status'

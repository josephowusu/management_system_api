

export interface iExpenseCategoryTable {
    id?:number,
    categoryName?:string
    dependency?:number
    color?:string
    description?:string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iExpenseCategoryUpdatableColumns = 'name'|'dependency'|'color'|'description'|'status'



export interface iProductCategoryTable {
    id?:number,
    categoryName?:string
    dependency?:number
    color?:string
    description?:string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iProductCategoryUpdatableColumns = 'categoryName'|'dependency'|'color'|'description'|'status'

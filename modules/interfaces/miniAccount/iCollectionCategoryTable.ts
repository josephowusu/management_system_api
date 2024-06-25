

export interface iCollectionCategoryTable {
    id?:number,
    categoryName?:string
    dependency?:number
    color?:string
    description?:string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iCollectionCategoryUpdatableColumns = 'name'|'dependency'|'color'|'description'|'status'

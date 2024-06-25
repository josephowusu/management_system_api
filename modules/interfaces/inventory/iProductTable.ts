

export interface iProductTable {
    id?:number
    images?:string[] | string | undefined
    name?:string
    type?:string
    productCategoryID?:number|null
    manufacturerID?:number|null
    UOMAndPrice?:string
    productDescription?:string
    sessionID?:string|number|null
    status?:string
    createdAt?:string
}


export type iProductUpdatableColumns = 'images'|'name'|'type'|'productCategoryID'|'manufacturerID'|'UOMAndPrice'|'productDescription'

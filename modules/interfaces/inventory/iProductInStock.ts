

export interface iProductInStockTable {
    id?:number
    stockID?:number
    productID?:number
    quantity?:number
    barCode?:string
    sessionID?:string|number|null
    status?:string
    createdAt?:string
}



export type iProductInStockUpdatableColumns = 'stockID'|'productID'|'quantity'|'barCode'|'status'


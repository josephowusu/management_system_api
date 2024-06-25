

export interface iStockTable {
    id?:number,
    supplierID?:number
    invoiceDate?:string
    InvoiceNumber?:number
    totalAmount?:number
    itemList?:string
    currency?:string
    exchangeRate?:number
    sessionID?:string|number|null
    status?:string
    createdAt?:string
}


export type iStockUpdatableColumns = 'supplierID'|'invoiceDate'|'InvoiceNumber'|'totalAmount'|'itemList'|'currency'|'status'

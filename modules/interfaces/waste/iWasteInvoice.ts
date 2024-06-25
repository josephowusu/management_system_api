

export interface iWasteInvoiceTable {
    id?:number
    clientID?:number
    date?:string
    wasteCategoryID?:number|null
    amount?:number
    quantity?:number
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iWasteInvoiceUpdatableColumns = 'clientID'|'date'|'wasteCategoryID'|'description'|'amount'|'quantity'|'status'

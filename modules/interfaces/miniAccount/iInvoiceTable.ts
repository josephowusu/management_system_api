

export interface iInvoiceTable {
    id?:number,
    invoiceType?:string
    invoiceDate?:string
    clientID?:number|null
    reference?:string
    itemList?:string|undefined
    invoiceAmount?:number
    invoiceBalance?:number|undefined
    currency?:string
    companyBankID?:number|null
    exchangeRate?:number
    tax?:boolean
    preparedBy?:string|number
    sessionID?:string|number|null
    status?:string
    createdAt?:string
}


export type iInvoiceUpdatableColumns = 'invoiceType'|'invoiceDate'|'clientID'|'reference'|'itemList'|'status'

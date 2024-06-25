

export interface iSalesTable {
    id?:number,
    clientID?:number|null
    purchaseSource?:string|undefined
    deliveryAddress?:string|undefined
    deliveryCost?:number|null
    country?:string
    currency?:string
    tax?:boolean
    itemList?:string
    discount?:number|null
    balance?:number|null
    paidAmount?:number
    paymentMethod?:string
    subTotal?:number
    grandTotal?:number
    companyBankID?:number|null
    walkInClientName?:string|undefined
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iSalesUpdatableColumns = 'purchaseSource'|'deliveryAddress'|'deliveryCost'|'country'|'currency'|'tax'|'discount'|'paidAmount'|'paymentMethod'|'subTotal'|'grandTotal'|'companyBankID'|'status'

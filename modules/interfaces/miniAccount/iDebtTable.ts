

export interface iDebtTable {
    id?:number,
    supplierID?:string|number
    debtCategoryID?:string|number
    invoiceNumber?:string|number
    amount?:number
    dateOfTransaction?:string
    dueDate?:string
    currency?:string
    exchangeRate?:number
    transactionDescription?:string
    status?:string
    sessionID?:string|number
    createdAt?:string
}


export type iDebtTableUpdatableColumns = 'supplierID'|'debtCategoryID'|'invoiceNumber'|'amount'|'currency'|'dateOfTransaction'|'dueDate'|'receiver'|'transactionDescription'|'status'

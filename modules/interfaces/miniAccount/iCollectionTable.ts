

export interface iCollectionTable {
    id?:number,
    collectionCategoryID?:number
    clientID?:number
    serviceID?:number
    description?:string
    charge?:number
    currency?:string
    amountPaid?:number
    balance?:number
    exchangeRate?:number
    paymentMethod?:string
    companyBankID?:number|null
    chequeNumber?:string
    dateOnCheque?:string
    mobileMoneyName?:string
    mobileMoneyNumber?:string
    paymentDate?:string
    paidBy?:string
    receivedBy?:string|number
    status?:string
    sessionID?:string|number
    createdAt?:string
}


export type iCollectionTableUpdatableColumns = 'collectionCategoryID'|'clientID'|'serviceID'|'description'|'charge'|'currency'|'amountPaid'|'balance'|'paymentMethod'|'companyBankID'|'chequeNumber'|'dateOnCheque'|'mobileMoneyName'|'mobileMoneyNumber'|'paymentDate'|'paidBy'|'receivedBy'|'status'


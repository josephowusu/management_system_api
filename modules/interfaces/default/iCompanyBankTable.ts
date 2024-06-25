

export interface iCompanyBankTable{
    id?:number,
    bankID?:number|null
    accountNumber?:number|string
    accountName?:string
    type?:string
    balance?:number
    sessionID?:number|string
    status?:string
    createdAt?:string
}



export type iCompanyBankTableUpdatableColumns = 'bankID'|'accountNumber'|'accountName'|'balance'|'status'



export interface iEmployeeBankTable{
    id?:number
    bankID?:number|null
    accountNumber?:number|string
    accountName?:string
    balance?:number
    sessionID?:number|string
    status?:string
    createdAt?:string
}


export type iEmployeeBankTableUpdatableColumns = 'bankID'|'accountNumber'|'accountName'|'balance'|'status'



export interface iExpenseTable {
    id?:number,
    expenseCategoryID?:string
    amount?:number
    expenseDate?:string
    receiver?:string
    description?:string
    currency?:string
    exchangeRate?:number
    status?:string
    sessionID?:string|number
    createdAt?:string
}


export type iExpenseTableUpdatableColumns = 'expenseCategoryID'|'amount'|'Currency'|'expenseDate'|'receiver'|'description'

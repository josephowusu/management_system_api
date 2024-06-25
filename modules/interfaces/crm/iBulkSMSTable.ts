

export interface iBulkSMSTable {
    id?:number
    numbers?:string
    message?:string
    sessionID?:number|string|null
    status?:string
    createdAt?:string
}

export type iBulkSMSTableUpdatableColumns = 'numbers' | 'message' | 'status'
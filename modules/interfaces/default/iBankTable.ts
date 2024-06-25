

export interface iBankTable{
    id?:number,
    name?:string
    sessionID?:number|string
    status?:string
    createdAt?:string
}


export type iBankTableUpdatableColumns = 'name'|'status'



export interface iTierData {
    id?:number,
    name?:string
    percentage?:string|number
    description?:string
    status?:string
    sessionID?:string|number
    createdAt?:string
}


export type iTierTableUpdatableColumns = 'name'|'percentage'|'description'|'status'

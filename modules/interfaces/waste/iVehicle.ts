

export interface iVehicleTable {
    id?:number
    type?:string
    model?:string
    numberPlate?:string
    brand?:string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iVehicleTableUpdatableColumns = 'type'|'model'|'numberPlate'|'brand'|'status'

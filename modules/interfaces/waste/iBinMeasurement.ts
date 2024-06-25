

export interface iBinMeasurementTable {
    id?:number
    size?:string
    type?:string
    description?:string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iBinMeasurementTableUpdatableColumns = 'size'|'type'|'description'|'status'

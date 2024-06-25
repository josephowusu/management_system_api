

export interface iManufacturer {
    id?:number,
    name?:string
    color?:string
    description?:string
    sessionID?:number|string
    status?:string
    createdAt?:string
}



export type iManufacturerUpdatableColumns = 'name'|'color'|'description'|'status'

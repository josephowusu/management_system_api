

export interface iDriverTable {
    id?:number
    personID?:number|null
    licenseNumber?:string
    licenseExpiry?:string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iDriverTableUpdatableColumns = 'personID'|'licenseNumber'|'licenseExpiry'|'status'



export interface iBusinessData {
    id?:number,
    uniqueCode?:string
    name?:string
    taxIdentificationNumber?:string
    smsDisplayName?:string
    contactID?:number
    addressID?:number
    status?:string
    createdAt?:string
}


export type iBusinessUpdatableColumns = 'uniqueCode'|'name'|'taxIdentificationNumber'|'contactID'|'addressID'|'smsDisplayName'|'status'

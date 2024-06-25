

export interface iSupplierData {
    id?:number
    personID?:number
    contactID?:number
    addressID?:number
    contactPersonID?:number
    contactPersonContactID?:number
    contactPersonAddressID?:number
    contactPersonRole?:string
    supplierType?:string
    businessID?:number
    balance?:number
    status?:string
    createdAt?:string
    sessionID?:number|string|null
}


export type iSupplierUpdatableColumns = 'personID' | 'contactID' | 'addressID' | 'contactPersonID' | 'contactPersonContactID' | 'contactPersonAddressID' | 'contactPersonRole' | 'supplierType' | 'businessID' | 'balance' | 'status' | 'createdAt'
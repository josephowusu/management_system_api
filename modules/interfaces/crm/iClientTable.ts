

export interface iClientData {
    id?:number
    personID?:number
    contactID?:number
    addressID?:number
    digitalAddressID?:number
    contactPersonID?:number
    contactPersonContactID?:number
    contactPersonAddressID?:number
    contactPersonRole?:string
    clientType?:string
    clientCategoryID?:number|null
    businessID?:number
    balance?:number
    sessionID?:number|string|null
    status?:string
    createdAt?:string
}

export type iClientUpdatableColumns = 'personID' | 'contactID' | 'addressID' | 'clientCategoryID' | 'contactPersonID' | 'contactPersonContactID' | 'contactPersonAddressID' | 'contactPersonRole' | 'clientType' | 'businessID' | 'balance' | 'status' | 'createdAt'
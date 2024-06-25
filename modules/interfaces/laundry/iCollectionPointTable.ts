

export interface iCollectionPointTable {
    id?:number
    collectionPoint?:string
    phone?:string|number
    contactPersonID?:number
    contactPersonContactID?:number
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iCollectionPointUpdatableColumns = 'collectionPoint'|'phone'|'contactPersonID'

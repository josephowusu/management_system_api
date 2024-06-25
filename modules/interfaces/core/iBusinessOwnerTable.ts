

export interface iBusinessOwnerData {
    id?:number
    businessID?:number
    firstName?:string
    otherName?:string
    lastName?:string
    status?:string
    createdAt?:string
}


export type iBusinessOwnerUpdatableColumns = 'firstName'|'otherName'|'lastName'|'status'




export interface iPersonData {
    id?:number
    firstName?:string
    otherName?:string
    lastName?:string
    gender?:string
    dateOfBirth?:string
    maritalStatus?:string
    placeOfBirth?:string
    nationality?:string
    nationalIdNumber?:string
    socialSecurityNumber?:string
    status?:string
    createdAt?:string
}


export type iPersonUpdatableColumns = 'firstName'|'otherName'|'lastName'|'gender'|'dateOfBirth'|'maritalStatus'|'placeOfBirth'|'nationality'|'nationalIdNumber'|'socialSecurityNumber'|'status'


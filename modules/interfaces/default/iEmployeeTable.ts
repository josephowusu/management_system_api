

export interface iEmployeeData {
    id?:number,
    personID?:number|null
    contactID?:number|null
    addressID?:number|null
    departmentID?:number|null
    role?:string
    employeeBankID?:number|null
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iEmployeeUpdatableColumns = 'status'|'personID'|'contactID'|'addressID'|'departmentID'|'role'|'employeeBankID'



export interface iUserData {
    id?:number,
    employeeID?:number
    username?:string
    password?:string
    status?:string
    sessionID?:number|null
    createdAt?:string
}


export type iUserUpdatableColumns = 'employeeID'|'username'|'password'|'status'

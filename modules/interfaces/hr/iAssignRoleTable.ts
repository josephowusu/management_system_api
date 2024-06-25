

export interface iAssignRoleData {
    id?:number,
    employeeID?:string|number
    roleID?:string|number
    description?:string
    status?:string
    sessionID?:string|number
    createdAt?:string
}


export type iAssignRoleTableUpdatableColumns = 'employeeID'|'roleID'|'description'|'status'

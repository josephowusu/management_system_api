

export interface iRoleData {
    id?:number,
    name?:string
    description?:string
    status?:string
    sessionID?:string|number
    createdAt?:string
}

export type iRoleTableUpdatableColumns = 'name'|'description'|'status'

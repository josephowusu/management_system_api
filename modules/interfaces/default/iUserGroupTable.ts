

export interface iUserGroup {
    id?:number,
    name?:string
    description?:string
    sessionID?:string|number
    status?:string
    createdAt?:string
}


export type iUserGroupUpdatableColumns = 'name'|'description'|'sessionID'|'status'

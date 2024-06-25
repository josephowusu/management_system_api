

export interface iService {
    id?:number,
    name?:string
    description?:string
    sessionID?:string|number|null
    status?:string
    createdAt?:string
}


export type iServiceUpdatableColumns = 'name'|'description'|'sessionID'|'status'

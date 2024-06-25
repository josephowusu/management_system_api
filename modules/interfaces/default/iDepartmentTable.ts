

export interface iDepartmentTable{
    id?:number,
    name?:string
    color?:string
    description?:string
    status?:string
    createdAt?:string
}



export type iDepartmentTableUpdatableColumns = 'name'|'color'|'description'|'status'

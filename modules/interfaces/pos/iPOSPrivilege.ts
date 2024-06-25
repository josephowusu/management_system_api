
export interface iPOSPrivilege {
    id?:number
    userID?:number
    groupID?:number
    
    addNewSales?:string
    updateExistingSale?:string
    deactivateExistingSale?:string
    deleteExistingSale?:string

    assignAllPrivileges?:string
}



export type iPOSPrivilegeUpdatableColumns = 'userID'|'groupID'|'addNewSales'|'updateExistingSale'|'deactivateExistingSale'|'deleteExistingSale'|'assignAllPrivileges'
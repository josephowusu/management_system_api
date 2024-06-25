

export interface iHRPrivilege {
    id?:number
    userID?:number
    groupID?:number
    addNewTier?:string
    updateExistingTier?:string
    deactivateExistingTier?:string
    deleteExistingTier?:string
    assignHRPrivileges?:string
    addNewRole?:string
    updateExistingRole?:string
    deactivateExistingRole?:string
    deleteExistingRole?:string
    addNewAssignRole?:string
    updateExistingAssignRole?:string
    deactivateExistingAssignRole?:string
    deleteExistingAssignRole?:string
}


export type iHRPrivilegeUpdatableColumns = 'userID'|'groupID'|'addNewTier'|'updateExistingTier'|'deactivateExistingTier'|'deleteExistingTier'|'addNewRole'|'updateExistingRole'|'deactivateExistingRole'|'deleteExistingRole'|'addNewAssignRole'|'updateExistingAssignRole'|'deactivateExistingAssignRole'|'deleteExistingAssignRole'|'assignHRPrivileges'
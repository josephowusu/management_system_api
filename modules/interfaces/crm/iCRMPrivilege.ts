

export interface iCRMPrivilege {
    id?:number
    userID?:number
    groupID?:number
    addNewClient?:string
    updateExistingClient?:string
    deactivateExistingClient?:string
    deleteExistingClient?:string
    addNewClientCategory?:string
    updateExistingClientCategory?:string
    deactivateExistingClientCategory?:string
    deleteExistingClientCategory?:string
    sendBulkSMS?:string
    sendBulkEmail?:string
    assignCRMPrivileges?:string
}


export type iCRMPrivilegeUpdatableColumns = 'userID'|'groupID'|'addNewClient'|'updateExistingClient'|'deactivateExistingClient'|'deleteExistingClient'|'addNewClientCategory'|'updateExistingClientCategory'|'deactivateExistingClientCategory'|'deleteExistingClientCategory'|'sendBulkSMS'|'sendBulkEmail'|'assignCRMPrivileges'
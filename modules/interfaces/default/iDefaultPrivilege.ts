

export interface iDefaultPrivilege {
    id?:number
    userID?:number
    groupID?:number
    assignAllPrivileges?:string

    addNewUser?:string
    updateExistingUser?:string
    deactivateExistingUser?:string
    deleteExistingUser?:string

    addNewService?:string
    updateExistingService?:string
    deactivateExistingService?:string
    deleteExistingService?:string

    addNewDepartment?:string
    updateExistingDepartment?:string
    deactivateExistingDepartment?:string
    deleteExistingDepartment?:string

    addNewManufacturer?:string
    updateExistingManufacturer?:string
    deactivateExistingManufacturer?:string
    deleteExistingManufacturer?:string

    addNewEmployee?:string
    updateExistingEmployee?:string
    deactivateExistingEmployee?:string
    deleteExistingEmployee?:string

    updateBusinessProfile?:string
}


export type iDefaultPrivilegeUpdatableColumns = 'userID'|'groupID'|'assignAllPrivileges'|'addNewUser'|'updateExistingUser'|'deactivateExistingUser'|'deleteExistingUser'|'addNewEmployee'|'updateExistingEmployee'|'deactivateExistingEmployee'|'deleteExistingEmployee'|'addNewManufacturer'|'updateExistingManufacturer'|'deactivateExistingManufacturer'|'deleteExistingManufacturer'|'addNewService'|'updateExistingService'|'deactivateExistingService'|'deleteExistingService'|'addNewDepartment'|'updateExistingDepartment'|'deactivateExistingDepartment'|'deleteExistingDepartment'|'updateBusinessProfile'
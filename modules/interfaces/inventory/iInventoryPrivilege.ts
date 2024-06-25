
export interface iInventoryPrivilege {
    id?:number
    userID?:number
    groupID?:number
    
    addNewProduct?:string
    updateExistingProduct?:string
    deactivateExistingProduct?:string
    deleteExistingProduct?:string

    addNewProductCategory?:string
    updateExistingProductCategory?:string
    deactivateExistingProductCategory?:string
    deleteExistingProductCategory?:string
    
    addNewStocking?:string
    updateExistingStocking?:string
    deactivateExistingStocking?:string
    deleteExistingStocking?:string

    addNewSupplier?:string
    updateExistingSupplier?:string
    deactivateExistingSupplier?:string
    deleteExistingSupplier?:string

    assignAllPrivileges?:string
}

export type iInventoryPrivilegeUpdatableColumns = 'userID'|'groupID'|"addNewProduct"|"updateExistingProduct"|"deactivateExistingProduct"|"deleteExistingProduct"|"addNewProductCategory"|"updateExistingProductCategory"|"deactivateExistingProductCategory"|"deleteExistingProductCategory"|"addNewStocking"|"updateExistingStocking"|"deactivateExistingStocking"|"deleteExistingStocking"|"addNewSupplier"|"updateExistingSupplier"|"deactivateExistingSupplier"|"deleteExistingSupplier"|"assignAllPrivileges"


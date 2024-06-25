
export interface iMiniAccountPrivilege {
    id?:number
    userID?:number
    groupID?:number
    
    addNewInvoice?:string
    updateExistingInvoice?:string
    deactivateExistingInvoice?:string
    deleteExistingInvoice?:string

    addNewCompanyBank?:string
    updateExistingCompanyBank?:string
    deactivateExistingCompanyBank?:string
    deleteExistingCompanyBank?:string

    addNewExpenseCategory?:string
    updateExistingExpenseCategory?:string
    deactivateExistingExpenseCategory?:string
    deleteExistingExpenseCategory?:string

    addNewExpense?:string
    updateExistingExpense?:string
    deactivateExistingExpense?:string
    deleteExistingExpense?:string
    
    addNewCollection?:string
    updateExistingCollection?:string
    deactivateExistingCollection?:string
    deleteExistingCollection?:string

    addNewCollectionCategory?:string
    updateExistingCollectionCategory?:string
    deactivateCollectionCategory?:string
    deleteCollectionCategory?:string

    addNewDebt?:string
    updateExistingDebt?:string
    deactivateDebt?:string
    deleteDebt?:string

    addNewDebtCategory?:string
    updateExistingDebtCategory?:string
    deactivateDebtCategory?:string
    deleteDebtCategory?:string

    assignAllPrivileges?:string
}

export type iMiniAccountPrivilegeUpdatableColumns = 'userID'|'groupID'|'addNewInvoice'|'updateExistingInvoice'|'deactivateExistingInvoice'|'deleteExistingInvoice'|'addNewCompanyBank'|'updateExistingCompanyBank'|'deactivateExistingCompanyBank'|'deleteExistingCompanyBank'|'addNewExpenseCategory'|'updateExistingExpenseCategory'|'deactivateExistingExpenseCategory'|'deleteExistingExpenseCategory'|'addNewExpense'|'updateExistingExpense'|'deactivateExistingExpense'|'deleteExistingExpense'|'addNewCollection'|'updateExistingCollection'|'deactivateExistingCollection'|'deleteExistingCollection'|'addNewCollectionCategory'|'updateExistingCollectionCategory'|'deactivateCollectionCategory'|'deleteCollectionCategory'|'addNewDebt'|'updateExistingDebt'|'deactivateDebt'|'deleteDebt'|'addNewDebtCategory'|'updateExistingDebtCategory'|'deactivateDebtCategory'|'deleteDebtCategory'|'assignAllPrivileges'
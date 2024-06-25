

export interface iNotificationSettings {
    id?:number
    userID?:string|number
    newInsertInApp?:string
    newInsertSMS?:string
    newInsertEmail?:string
    updateInApp?:string
    updateSMS?:string
    updateEmail?:string
    deactivateInApp?:string
    deactivateSMS?:string
    deactivateEmail?:string
    reactivateInApp?:string
    reactivateSMS?:string
    reactivateEmail?:string
    deleteInApp?:string
    deleteSMS?:string
    deleteEmail?:string
    paymentInApp?:string
    paymentSMS?:string
    paymentEmail?:string
    systemInApp?:string
    systemSMS?:string
    systemEmail?:string
}


export type iNotificationSettingsUpdatableColumns = 'newInsertInApp'|'newInsertSMS'|'newInsertEmail'|'updateInApp'|'updateSMS'|'updateEmail'|'deactivateInApp'|
'deactivateSMS'|'deactivateEmail'|'reactivateInApp'|'reactivateSMS'|'reactivateEmail'|'deleteInApp'|'deleteSMS'|
'deleteEmail'|'paymentInApp'|'paymentSMS'|'paymentEmail'|'systemInApp'|'systemSMS'|'systemEmail'

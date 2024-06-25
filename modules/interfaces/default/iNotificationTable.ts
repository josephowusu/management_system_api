import { iNotificationSettingsUpdatableColumns } from "./iNotificationSettings"




export type iAlertType = 'systemAction'|'paymentAction'|'newInsertAction'|'updateAction'|'deactivateAction'|'reactivateAction'|'deleteAction'|'chatAlert'

export interface iNotificationTable {
    id?:number
    title?:string
    message?:string
    type?:iAlertType
    readList?:string
    usersList?:string
    mainTableID?:string|number
    mainTableName?:string
    sessionID?:number|string
    createdAt?:string
}



export type iNotificationTableUpdatableColumns = 'readList'|'usersList'|'type'|'title'|'message'|'mainTableID'|'mainTableName'


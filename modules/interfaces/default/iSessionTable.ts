

export interface iSessionData {
    id?:number,
    userID?:number
    loginDateAndTime?:string
    logoutDateAndTime?:string|undefined|null
    token?:string|null
    logoutType?:string
    unauthorizedAccessData?:string
}


export type iSessionUpdatableColumns = 'loginDateAndTime'|'logoutDateAndTime'|'token'|'logoutType'|'unauthorizedAccessData'

import { UserAgent, Details } from "express-useragent"



export interface iControllerResponse {
    status:'error'|'warning'|'success'|''
    message:string
    data?:any
}


export interface iSessionToken {
    ipAddress:string
    userAgent:Details
    macAddress:string
    schema:string
    sessionID:string|number
}

export interface iAuthenticateBody {macAddress:string, schemaName:string, sessionID:string|number}


export type iSocketCallback = (response:any) => void


export interface iFileUploaderData {
    fileName:string|null
    fileSize:number
    fileType:string
    startByte:number
    endByte:number
    chunk:string
}

export interface iAuthenticateSessionResponseData {
    businessID:string|number
    businessCode:string
    userID:string|number
    privileges:any
    sessionID:string|number
}

export interface iAuthenticateSessionResponse {
    type:'success'|'invalid'|'unauthorized'|'error'|'warning'
    message?:string
    data?:iAuthenticateSessionResponseData
}


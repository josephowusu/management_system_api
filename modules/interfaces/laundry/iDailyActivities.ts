

export interface iDailyActivities {
    id?:number
    employeeID?:string|number
    activityDate?:string
    invoice?:string
    accessory?:string
    quantity?:number
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iDailyActivitiesUpdatableColumns = 'employeeID'|'activityDate'|'invoice'|'accessory'|'quantity'|'status'

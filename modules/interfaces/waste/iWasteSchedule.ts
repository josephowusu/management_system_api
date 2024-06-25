

export interface iWasteScheduleTable {
    id?:number
    scheduleDate?:string
    vehicleID?:number
    driverID?:number
    assistantDriverID?:number
    categoryID?:string
    subCategoryID?:string
    janitorSupervisor?:string
    routineStatus?:string
    invoicedSubCategory?:number|string
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iWasteScheduleTableUpdatableColumns = 'scheduleDate'|'vehicleID'|'driverID'|'assistantDriverID'|'categoryID'|'subCategoryID'|'janitorSupervisor'|'routineStatus'|'invoicedSubCategory'

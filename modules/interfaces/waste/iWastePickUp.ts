

export interface iWastePickUpTable {
    id?:number
    wasteScheduleID?:string|number
    clientID?:string|number
    code?:string
    longitude?:string
    latitude?:string
    binMeasurementID?:string|number
    amount?:number
    currency?:string
    exchangeRate?:number
    status?:string
    sessionID?:string|number|null
    createdAt?:string
}


export type iWastePickUpTableUpdatableColumns = 'hiddenID'|'wasteScheduleID'|'clientID'|'code'|'longitude'|'latitude'|'amount'|'binMeasurementID'|'amount'|'status'

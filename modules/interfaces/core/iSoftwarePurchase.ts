

export interface iSoftwarePurchaseData {
    id?:number
    businessID?:string|number
    businessCode?:string
    softwarePackageID?:string|number
    paymentMethod?:string
    accountNumber?:string
    accountName?:string
    packagePrice?:number
    numberOfMonths?:number
    paidAmount?:number
    paymentDate?:string
    referenceNumber?:string
    email?:string
    phone?:string
    transactionId?:string
    endOfSubscriptionDate?:string
    status?:string
    createdAt?:string
}

export type iSoftwarePurchaseDataUpdatableColumns = 'softwarePackageID'|'paymentMethod'|'accountNumber'|'accountName'|'packagePrice'|'numberOfMonths'|'paidAmount'|'paymentDate'|'referenceNumber'|'email'|'phone'|'transactionId'|'endOfSubscriptionDate'|'status'


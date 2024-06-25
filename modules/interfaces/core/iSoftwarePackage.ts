

export interface iSoftwarePackageData {
    id?:number
    icon?:string
    name?:string
    price?:number
    uom?:string
    description?:string
    details?:string
    images?:string[]|string
    features?:string[]|string
    status?:string
    createdAt?:string
}

export type iSoftwarePackageDataUpdatableColumns = 'icon'|'name'|'price'|'uom'|'description'|'details'|'images'|'features'|'status'



export interface iAddressData {
    id?:number,
    postalAddress?:string
    digitalAddress?:string
    location?:string
    landMark?:string
    geoLatitude?:string
    geoLongitude?:string
    country?:string
    stateOrRegion?:string
    cityOrTown?:string
    suburb?:string
    status?:string
    createdAt?:string
}


export type iAddressUpdatableColumns = 'postalAddress'|'digitalAddress'|'location'|'landMark'|'geoLatitude'|'geoLongitude'|'country'|'stateOrRegion'|'cityOrTown'|'suburb'|'status'

import { iModelClass } from "../iMigration"

export interface iBusinessData {
    id?:number
    uniqueCode?:string
    name?:string
    location?:string
    address?:string
    email?:string
    phone?:string
    country?:string
    stateOrRegion?:string
    cityOrTown?:string
    status?:string
    createdAt?:string
}


export type iBusinessUpdatableColumns = 'name'|'location'|'postalAddress'|'email'|'phone'|'country'|'stateOrRegion'|'cityOrTown'|'status'


export interface iBusinessTable extends iModelClass {

}


export interface iContactData {
    id?:number
    phone?:string
    mobile?:string
    email?:string
    alternativeEmail?:string
    website?:string
    socialLinks?:string
    status?:string
    createdAt?:string
}


export type iContactUpdatableColumns = 'phone'|'mobile'|'email'|'alternativeEmail'|'website'|'socialLinks'|'status'

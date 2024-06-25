import MySQL from "mysql"
import { Socket } from "socket.io"
import AddressTable from "../../../models/mainApp/default/AddressTable"
import BusinessTable from "../../../models/mainApp/default/BusinessTable"
import ContactTable from "../../../models/mainApp/default/ContactTable"
import PersonTable from "../../../models/mainApp/default/PersonTable"
import { arrangeName, authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import ClientTable from "../../../models/mainApp/crm/ClientTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"

interface socketBody {
    clientType?:string
    clientName?:string
    clientPhone?:string
    clientEmail?:string
    clientGender?:string
    clientDOB?:string
    clientCategoryID?:string|number
    schemaName:string
    postalAddress?:string
    digitalAddress?:string
    macAddress:string
    contactPersonName?:string
    contactPersonPhoneNumber?:string
    contactPersonEmail?:string
    contactPersonGender?:string
    contactPersonRole?:string
    sessionID:string|number
    clientHiddenID?:number
}

const ClientController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
    if ( !body.macAddress || !body.schemaName){
        callback({status: "error", message: "Missing important parameter. Contact system administrator for support!"})
        return
    }

    const isSession = await authenticateSession(socket, database, body.macAddress ? body.macAddress : '', body.schemaName ? body.schemaName : '', body.sessionID ? body.sessionID : '')

    if (isSession.type === 'success') {
        const userID = isSession.data?.userID ? isSession.data?.userID : 0
        const businessCode = isSession.data?.businessCode ? isSession.data?.businessCode : 'null'
        const schemaName = body.schemaName ? body.schemaName : ''
        let privileges:iPrivileges = {}
        if (database) {
            privileges = await fetchPrivileges(userID, businessCode, schemaName, database)
        }
        if (controllerType === 'insert/update') {
            if (body.clientHiddenID) {
                if (privileges.CRM?.updateExistingClient == 'yes') {
                    updateClient(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if ( body.clientType === 'Business' ){
                    //add client if type is business
                    if (privileges.CRM?.addNewClient == 'yes') {
                        addBusiness(socket, database, body, callback, userID)
                    } else {
                        callback({
                            status: 'warning',
                            message: 'You have no privilege to perform this task!'
                        })
                    }
                } else if (body.clientType === 'Person') {
                    //add client if type is person
                    if (privileges.CRM?.addNewClient == 'yes') {
                        addClient(socket, database, body, callback, userID)
                    } else {
                        callback({
                            status: 'warning',
                            message: 'You have no privilege to perform this task!'
                        })
                    }
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.CRM?.addNewClient == 'yes' || 
            privileges.CRM?.updateExistingClient == 'yes' || 
            privileges.CRM?.deactivateExistingClient == 'yes' ||
            privileges.CRM?.deleteExistingClient == 'yes') {
                getClient(socket, database, body, callback)
            } else {
                callback({
                    status: 'warning',
                    message: 'You have no privilege to perform this task!'
                })
            }
        }
    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired!'
        })
    }
}

async function updateClient(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {clientType, clientName, clientPhone, clientEmail, clientCategoryID, clientGender, clientDOB, postalAddress, digitalAddress, macAddress, schemaName, contactPersonName, contactPersonPhoneNumber, contactPersonEmail, contactPersonGender, contactPersonRole, sessionID, clientHiddenID} = body
    
    //check for required fields
    if (!clientName || !clientPhone || !clientType || !clientHiddenID){
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const clientTable = new ClientTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)
    const businessTable = new BusinessTable(undefined, database, schemaName)
    const contactPersonContactTable = new ContactTable(undefined, database, schemaName)

    const checker = await clientTable.get("client.id = ?", [clientHiddenID], 1, 0)

    if (checker.length > 0) {
        if (clientType === "Business") {
            const businessSearchResult = await businessTable.get("uniqueCode = ? AND name = ?", [schemaName, clientName], 1, 0)
            //returns Client already exists if client exists
            if (businessSearchResult.length > 0) {
                callback({ status: "exists", message: "Client already exists" })
                return
            } else {
                // setting values
                businessTable.setValues({
                    id: businessSearchResult[0].businessID,
                    uniqueCode: schemaName,
                    name: clientName,
                    taxIdentificationNumber: undefined,
                    smsDisplayName: undefined,
                    contactID: undefined,
                    addressID: undefined,
                })
    
                const businessSaveResult = await businessTable.update(["uniqueCode","name","taxIdentificationNumber","smsDisplayName","contactID","addressID"])
    
                contactTable.setValues({
                    id: businessSearchResult[0].contactID,
                    phone: clientPhone,
                    mobile: undefined,
                    email: clientEmail,
                    alternativeEmail: undefined,
                    website: undefined,
                    socialLinks: undefined,
                })
                const contactSaveResult = await contactTable.update(["phone","mobile","email","alternativeEmail","website","socialLinks"])
    
    
                contactPersonContactTable.setValues({
                    id: businessSearchResult[0].contactPersonContactID,
                    phone: contactPersonPhoneNumber,
                    mobile: undefined,
                    email: contactPersonEmail,
                    alternativeEmail: undefined,
                    website: undefined,
                    socialLinks: undefined,
                })
                const contactPersonContactSaveResult = await contactPersonContactTable.update(["phone","mobile","email","alternativeEmail","website","socialLinks"])
    
                addressTable.setValues({
                    id: businessSearchResult[0].addressID,
                    postalAddress: postalAddress,
                    digitalAddress: digitalAddress,
                    location: undefined,
                    landMark:  undefined,
                    geoLatitude: undefined,
                    geoLongitude: undefined,
                    country: undefined,
                    stateOrRegion: undefined,
                    cityOrTown: undefined,
                    suburb: undefined,
                })
                const addressSaveResult = await addressTable.update(["cityOrTown","country","digitalAddress","geoLatitude","geoLongitude","landMark","location","postalAddress","stateOrRegion","status","suburb"])
    
                const contactPersonNameArrangeResult = await arrangeName(contactPersonName ? contactPersonName : '')
                personTable.setValues({
                    id: businessSearchResult[0].personID,
                    firstName: contactPersonNameArrangeResult.first,
                    otherName: contactPersonNameArrangeResult.other,
                    lastName: contactPersonNameArrangeResult.last,
                    gender: contactPersonGender,
                    dateOfBirth: undefined,
                    maritalStatus: undefined,
                    placeOfBirth: undefined,
                    nationality: undefined,
                    nationalIdNumber: undefined,
                    socialSecurityNumber: undefined,
                })
                const contactPersonSaveResult = await personTable.update(["firstName","dateOfBirth","gender","lastName","maritalStatus","nationalIdNumber","nationality","otherName","placeOfBirth","socialSecurityNumber","status"])
    
                clientTable.setValues({
                    id: clientHiddenID,
                    personID: undefined,
                    contactID: contactSaveResult === 'success' ? businessSearchResult[0].contactID : undefined,
                    addressID: addressSaveResult === 'success' ? businessSearchResult[0].addressID : undefined,
                    contactPersonID: contactPersonSaveResult === 'success' ? businessSearchResult[0].contactPersonID : undefined,
                    contactPersonContactID: contactPersonContactSaveResult === 'success' ? businessSearchResult[0].contactPersonContactID : undefined,
                    contactPersonRole: contactPersonRole,
                    clientType: clientType,
                    clientCategoryID: clientCategoryID ? Number(clientCategoryID) : null,
                    businessID: businessSaveResult === 'success' ? businessSearchResult[0].businessID : undefined,
                    balance: 0,
                    sessionID: sessionID ? sessionID : null
                })
    
                const clientUpdateResult = await clientTable.update(["personID","contactID","addressID", "clientCategoryID","contactPersonID","contactPersonContactID","contactPersonRole","clientType","businessID"])
    
                if (clientUpdateResult === "success") {
                    callback({
                        status: 'success',
                        message: 'Client has been updated successfully',
                    })
                } else {
                    callback({
                        status: 'error',
                        message: 'Failed to update client',
                    })
                }
            } 
        } else if (clientType === "Person") {
            const clientSearchResult = await clientTable.get("CONCAT(IFNULL(person.firstName, ''), ' ', IFNULL(person.lastName, '')) = ? AND contact.phone = ? ", [clientName, clientPhone], 1, 0)
        
            //returns Client already exists if client exists
            if (clientSearchResult.length > 0) {
    
                callback({ status: "exists", message: "Client already exists" })
                return
    
            } else { 
                const clientNameArrangeResult = await arrangeName(clientName ? clientName : '')
                personTable.setValues({
                    id: clientSearchResult[0].personID,
                    firstName: clientNameArrangeResult.first,
                    otherName: clientNameArrangeResult.other,
                    lastName: clientNameArrangeResult.last,
                    gender: clientGender,
                    dateOfBirth: clientDOB,
                    maritalStatus: undefined,
                    placeOfBirth: undefined,
                    nationality: undefined,
                    nationalIdNumber: undefined,
                    socialSecurityNumber: undefined,
                })
                const personSaveResult = await personTable.update(["firstName","dateOfBirth","gender","lastName","maritalStatus","nationalIdNumber","nationality","otherName","placeOfBirth","socialSecurityNumber","status"])
    
                contactTable.setValues({
                    id: clientSearchResult[0].contactID,
                    phone: clientPhone,
                    mobile: undefined,
                    email: clientEmail,
                    alternativeEmail: undefined,
                    website: undefined,
                    socialLinks: undefined,
                })
                const contactSaveResult = await contactTable.update(["phone","mobile","email","alternativeEmail","website","socialLinks"])
    
                
                addressTable.setValues({
                    id: clientSearchResult[0].addressID,
                    postalAddress: postalAddress,
                    digitalAddress: digitalAddress,
                    location: undefined,
                    landMark:  undefined,
                    geoLatitude: undefined,
                    geoLongitude: undefined,
                    country: undefined,
                    stateOrRegion: undefined,
                    cityOrTown: undefined,
                    suburb: undefined,
                })
                const addressSaveResult = await addressTable.update(["cityOrTown","country","digitalAddress","geoLatitude","geoLongitude","landMark","location","postalAddress","stateOrRegion","status","suburb"])
    
    
                clientTable.setValues({
                    id: clientSearchResult[0].id,
                    personID: personSaveResult === 'success' ? clientSearchResult[0].personID : 0,
                    contactID: contactSaveResult === 'success' ? clientSearchResult[0].contactID : 0,
                    addressID: addressSaveResult === 'success' ? clientSearchResult[0].addressID : 0,
                    contactPersonID: undefined,
                    contactPersonContactID: undefined,
                    contactPersonAddressID: undefined,
                    contactPersonRole: undefined,
                    clientType: clientType,
                    clientCategoryID: clientCategoryID ? Number(clientCategoryID) : null,
                    businessID: undefined,
                    balance: 0,
                    sessionID: sessionID ? sessionID : null
                })
    
                const clientUpdateResult = await clientTable.update(["personID","contactID","addressID","contactPersonID","contactPersonContactID","contactPersonRole","clientType","businessID"])
    
                if (clientUpdateResult === "success") {
                    if (database && schemaName && sessionID && clientHiddenID) {
                        Notifier(database, socket, schemaName, sessionID, userID, clientHiddenID, 'client', "update an existing client", "updated client ", 'updateAction', 'crmPrivilege', 'updateExistingClient')
                    }
                    callback({
                        status: 'success',
                        message: 'Client has been updated successfully',
                    })
                    socket.broadcast.emit(schemaName+'/crm/insertUpdate', 'success')
                    socket.emit(schemaName+'/crm/insertUpdate', 'success')
                } else {
                    callback({
                        status: 'error',
                        message: 'Failed to update client',
                    })
                }
            }
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid client"
        })
    }
}


async function addBusiness(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {clientType, clientName, clientPhone, clientEmail, clientCategoryID, postalAddress, digitalAddress, macAddress, schemaName, contactPersonName, contactPersonPhoneNumber, contactPersonEmail, contactPersonGender, contactPersonRole, sessionID} = body

    //check for required fields
    if (!clientName || !clientPhone || !clientType){
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const clientTable = new ClientTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)
    const businessTable = new BusinessTable(undefined, database, schemaName)
    const contactPersonContactTable = new ContactTable(undefined, database, schemaName)
    const businessSearchResult = await businessTable.get("uniqueCode = ? AND name = ?", [schemaName, clientName], 1, 0)
    
    //returns Client already exists if client exists
    if (businessSearchResult.length > 0) {

        callback({ status: "exists", message: "Client already exists!" })
        return

    } else {
        // setting values
        businessTable.setValues({
            uniqueCode: schemaName,
            name: clientName,
            taxIdentificationNumber: undefined,
            smsDisplayName: undefined,
            contactID: undefined,
            addressID: undefined,
        })

        const businessSaveResult = await businessTable.save()

        contactTable.setValues({
            phone: clientPhone,
            mobile: undefined,
            email: clientEmail,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactSaveResult = await contactTable.save()


        contactPersonContactTable.setValues({
            phone: contactPersonPhoneNumber,
            mobile: undefined,
            email: contactPersonEmail,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactPersonContactSaveResult = await contactPersonContactTable.save()
        

        addressTable.setValues({
            postalAddress: postalAddress,
            digitalAddress: digitalAddress,
            location: undefined,
            landMark:  undefined,
            geoLatitude: undefined,
            geoLongitude: undefined,
            country: undefined,
            stateOrRegion: undefined,
            cityOrTown: undefined,
            suburb: undefined,
        })
        const addressSaveResult = await addressTable.save()

        const contactPersonNameArrangeResult = await arrangeName(contactPersonName ? contactPersonName : '')
        personTable.setValues({
            firstName: contactPersonNameArrangeResult.first,
            otherName: contactPersonNameArrangeResult.other,
            lastName: contactPersonNameArrangeResult.last,
            gender: contactPersonGender,
            dateOfBirth: undefined,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const contactPersonSaveResult = await personTable.save()

        clientTable.setValues({
            personID: undefined,
            contactID: contactSaveResult.type === 'success' ? contactSaveResult.primaryKey : undefined,
            addressID: addressSaveResult.type === 'success' ? addressSaveResult.primaryKey : undefined,
            contactPersonID: contactPersonSaveResult.type === 'success' ? contactPersonSaveResult.primaryKey : undefined,
            contactPersonContactID: contactPersonContactSaveResult.type === 'success' ? contactPersonContactSaveResult.primaryKey : undefined,
            contactPersonRole: contactPersonRole,
            clientType: clientType,
            clientCategoryID: clientCategoryID ? Number(clientCategoryID) : null,
            businessID: businessSaveResult.type === 'success' ? businessSaveResult.primaryKey : undefined,
            balance: 0,
            sessionID: sessionID ? sessionID : null
        })

        const clientSaveResult = await clientTable.save()

        if ( clientSaveResult.type == 'success' ) {

            if (database && schemaName && sessionID && clientSaveResult.primaryKey) {
                Notifier(database, socket, schemaName, sessionID, userID, clientSaveResult.primaryKey, 'client', "added a new client", "added client "+ clientName, 'newInsertAction', 'crmPrivilege', 'addNewClient')
            }
            callback({
                status: 'success',
                message: 'Client has been added successfully!',
                data: clientSaveResult.type == 'success' ? clientSaveResult.primaryKey : null
            })
            socket.broadcast.emit(schemaName+'/crm/insertUpdate', 'success')
            socket.emit(schemaName+'/crm/insertUpdate', 'success')
    
        } else {
            callback({
                status: "error",
                message: 'Failed to add client!'
            })
    
        }

    }

}


async function addClient(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {clientType, clientName, clientPhone, clientEmail, clientCategoryID, clientGender, postalAddress, digitalAddress, clientDOB, macAddress, schemaName, sessionID} = body

    //check for required fields
    if (!clientName || !clientPhone || !clientType) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }
        
    const personTable = new PersonTable(undefined, database, schemaName)
    const clientTable = new ClientTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)

    
    const clientSearchResult = await clientTable.get("CONCAT(IFNULL(person.firstName, ''), ' ', IFNULL(person.lastName, '')) = ? AND contact.phone = ? ", [clientName, clientPhone], 1, 0)
    
    //returns Client already exists if client exists
    if (clientSearchResult.length > 0) {

        callback({ status: "exists", message: "Client already exists!" })
        return

    } else {

        const clientNameArrangeResult = await arrangeName(clientName ? clientName : '')
        console.log(clientNameArrangeResult);
        
        personTable.setValues({
            firstName: clientNameArrangeResult.first,
            otherName: clientNameArrangeResult.other,
            lastName: clientNameArrangeResult.last,
            gender: clientGender,
            dateOfBirth: clientDOB,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const personSaveResult = await personTable.save()

        contactTable.setValues({
            phone: clientPhone,
            mobile: undefined,
            email: clientEmail,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactSaveResult = await contactTable.save()

        
        addressTable.setValues({
            postalAddress: postalAddress,
            digitalAddress: digitalAddress,
            location: undefined,
            landMark:  undefined,
            geoLatitude: undefined,
            geoLongitude: undefined,
            country: undefined,
            stateOrRegion: undefined,
            cityOrTown: undefined,
            suburb: undefined,
        })
        const addressSaveResult = await addressTable.save()


        clientTable.setValues({
            personID: personSaveResult.type === 'success' ? personSaveResult.primaryKey : 0,
            contactID: contactSaveResult.type === 'success' ? contactSaveResult.primaryKey : 0,
            addressID: addressSaveResult.type === 'success' ? addressSaveResult.primaryKey : 0,
            contactPersonID: undefined,
            contactPersonContactID: undefined,
            contactPersonAddressID: undefined,
            contactPersonRole: undefined,
            clientType: clientType,
            clientCategoryID: clientCategoryID ? Number(clientCategoryID) : null,
            businessID: undefined,
            balance: 0,
            sessionID: sessionID ? sessionID : null
        })

        const clientSaveResult = await clientTable.save()

        if ( clientSaveResult.type == 'success' ) {

            if (database && schemaName && sessionID && clientSaveResult.primaryKey) {
                Notifier(database, socket, schemaName, sessionID, userID, clientSaveResult.primaryKey, 'client', "added a new client", "added client "+ clientName, 'newInsertAction', 'crmPrivilege', 'addNewClient')
            }
            callback({
                status: 'success',
                message: 'Client has been added successfully!',
                data: clientSaveResult.type == 'success' ? clientSaveResult.primaryKey : null
            })
            socket.broadcast.emit(schemaName+'/crm/insertUpdate', 'success')
            socket.emit(schemaName+'/crm/insertUpdate', 'success')
    
        } else {
            callback({
                status: "error",
                message: 'Failed to add client!'
            })
    
        }
    }

}


async function getClient(socket:Socket, database:MySQL.Connection|null, body:any, callback:any) {
    
    const {schemaName} = body

    const client = new ClientTable(undefined, database, schemaName)
    const allClient = await client.getAll(10, 0)
    
    if ( allClient.length > 0) {
        callback({
            status: "success",
            data: allClient
        })
    } else {
        callback({
            status: "empty",
            message: "Client list is empty!"
        })
    }
}


export default ClientController
import MySQL from "mysql"
import { Socket } from "socket.io"
import AddressTable from "../../../models/mainApp/default/AddressTable"
import BusinessTable from "../../../models/mainApp/default/BusinessTable"
import ContactTable from "../../../models/mainApp/default/ContactTable"
import PersonTable from "../../../models/mainApp/default/PersonTable"
import { arrangeName, authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import SupplierTable from "../../../models/mainApp/inventory/SupplierTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"

interface socketBody {
    supplierType?:string
    supplierName?:string
    supplierPhone?:string
    supplierEmail?:string
    supplierGender?:string
    supplierDOB?:string
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
    supplierHiddenID?:string|number
}

const SupplierController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.supplierHiddenID) {
                if (privileges.Inventory?.updateExistingSupplier == 'yes') {
                    if (body.supplierType === "Business") {
                        updateSupplierBusiness(socket, database, body, callback, userID)
                    } else if (body.supplierType === "Person") {
                        updateSupplierPerson(socket, database, body, callback, userID)
                    }
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if ( body.supplierType === 'Business' ) {
                    if (privileges.Inventory?.addNewSupplier == 'yes') {
                        addBusiness(socket, database, body, callback, userID)
                    } else {
                        callback({
                            status: 'warning',
                            message: 'You have no privilege to perform this task!'
                        })
                    }

                } else {
                    if (privileges.Inventory?.addNewSupplier == 'yes') {
                        addSupplier(socket, database, body, callback, userID)
                    } else {
                        callback({
                            status: 'warning',
                            message: 'You have no privilege to perform this task!'
                        })
                    }
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.Inventory?.addNewSupplier == 'yes' || 
            privileges.Inventory?.updateExistingSupplier == 'yes' || 
            privileges.Inventory?.deactivateExistingSupplier == 'yes' ||
            privileges.Inventory?.deleteExistingSupplier == 'yes') {
                getSupplier(socket, database, body, callback)
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
            message: 'Session has expired'
        })
    }
}

async function updateSupplierPerson(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {supplierType, supplierName, supplierPhone, supplierEmail, supplierGender, postalAddress, digitalAddress, supplierDOB, supplierHiddenID, schemaName, sessionID} = body

    //check for required fields
    if (!supplierName || !supplierPhone || !supplierType || !supplierEmail || !digitalAddress || !postalAddress || !supplierHiddenID){
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const supplierTable = new SupplierTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)

    const checker = await supplierTable.get("supplier.id = ?", [supplierHiddenID], 1, 0)

    if (checker.length > 0) {
        const supplierNameArrangeResult = await arrangeName(supplierName ? supplierName : '')
        console.log(supplierNameArrangeResult);
        
        personTable.setValues({
            id: checker[0].personID,
            firstName: supplierNameArrangeResult.first,
            otherName: supplierNameArrangeResult.other,
            lastName: supplierNameArrangeResult.last,
            gender: supplierGender,
            dateOfBirth: supplierDOB,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const personSaveResult = await personTable.update(["firstName","otherName","lastName","gender","dateOfBirth","maritalStatus","nationality","nationalIdNumber","socialSecurityNumber"])

        contactTable.setValues({
            id: checker[0].contactID,
            phone: supplierPhone,
            mobile: undefined,
            email: supplierEmail,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactSaveResult = await contactTable.update(["phone", "email", "mobile","alternativeEmail","website","socialLinks"])
        
        addressTable.setValues({
            id: checker[0].addressID,
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
        const addressSaveResult = await addressTable.update(["postalAddress","digitalAddress","location","landMark","geoLatitude","geoLongitude","country","stateOrRegion","cityOrTown","suburb"])

        supplierTable.setValues({
            id: Number(supplierHiddenID),
            personID: personSaveResult === 'success' ? checker[0].personID : 0,
            contactID: contactSaveResult === 'success' ? checker[0].contactID : 0,
            addressID: addressSaveResult === 'success' ? checker[0].addressID : 0,
            contactPersonID: undefined,
            contactPersonContactID: undefined,
            contactPersonAddressID: undefined,
            contactPersonRole: undefined,
            supplierType: supplierType,
            businessID: undefined,
        })

        const supplierSaveResult = await supplierTable.update(["personID","contactID","addressID","contactPersonID","contactPersonContactID","contactPersonRole","supplierType","businessID"])

        if ( supplierSaveResult == "success" ) {

            callback({
                status: 'success',
                message: 'Supplier has been updated successfully',
                data: supplierSaveResult == 'success' ? supplierHiddenID : null
            })

        } else {

            callback({
                status: 'error',
                message: 'Failed to update Supplier',
            })
        }
    }
}

async function updateSupplierBusiness(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {supplierType, supplierName, supplierPhone, supplierEmail, postalAddress, digitalAddress, supplierHiddenID, schemaName, contactPersonName, contactPersonPhoneNumber, contactPersonEmail, contactPersonGender, contactPersonRole, sessionID} = body

    //check for required fields
    if (!supplierName || !supplierPhone || !supplierType || !supplierEmail || !digitalAddress || !postalAddress ||!supplierHiddenID){
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const supplierTable = new SupplierTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)
    const businessTable = new BusinessTable(undefined, database, schemaName)
    const contactPersonContactTable = new ContactTable(undefined, database, schemaName)

    const checker = await supplierTable.get("supplier.id = ?", [supplierHiddenID], 1, 0)

    if (checker.length > 0) {
        businessTable.setValues({
            id: checker[0].businessID,
            uniqueCode: schemaName,
            name: supplierName,
            taxIdentificationNumber: undefined,
            smsDisplayName: undefined,
            contactID: undefined,
            addressID: undefined,
        })
        const businessSaveResult = await businessTable.update(["uniqueCode","name","taxIdentificationNumber","smsDisplayName","contactID","addressID"])

        contactTable.setValues({
            id: checker[0].contactID,
            phone: supplierPhone ? supplierPhone : undefined,
            mobile: undefined,
            email: supplierEmail ? supplierEmail : undefined,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactSaveResult = await contactTable.update(["phone", "email", "mobile","alternativeEmail","website","socialLinks"])

        contactPersonContactTable.setValues({
            id: checker[0].contactPersonContactID,
            phone: contactPersonPhoneNumber ? contactPersonPhoneNumber : undefined,
            mobile: undefined,
            email: contactPersonEmail ? contactPersonEmail : undefined,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactPersonContactSaveResult = await contactPersonContactTable.update(["phone", "email", "mobile","alternativeEmail","website","socialLinks"])

        addressTable.setValues({
            id: checker[0].addressID,
            postalAddress: postalAddress ? postalAddress : undefined,
            digitalAddress: digitalAddress ? digitalAddress : undefined,
            location: undefined,
            landMark:  undefined,
            geoLatitude: undefined,
            geoLongitude: undefined,
            country: undefined,
            stateOrRegion: undefined,
            cityOrTown: undefined,
            suburb: undefined,
        })
        const addressSaveResult = await addressTable.update(["postalAddress","digitalAddress","location","landMark","geoLatitude","geoLongitude","country","stateOrRegion","cityOrTown","suburb"])

        const contactPersonNameArrangeResult = await arrangeName(contactPersonName ? contactPersonName : '')
        personTable.setValues({
            id: checker[0].contactPersonID,
            firstName: contactPersonNameArrangeResult.first,
            otherName: contactPersonNameArrangeResult.other ? contactPersonNameArrangeResult.other : undefined,
            lastName: contactPersonNameArrangeResult.last,
            gender: contactPersonGender,
            dateOfBirth: undefined,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const contactPersonSaveResult = await personTable.update(["firstName","otherName","lastName","gender","dateOfBirth","maritalStatus","nationality","nationalIdNumber","socialSecurityNumber"])

        supplierTable.setValues({
            id: Number(supplierHiddenID),
            personID: undefined,
            contactID: contactSaveResult === 'success' ? checker[0].contactID : undefined,
            addressID: addressSaveResult === 'success' ? checker[0].addressID : undefined,
            contactPersonID: contactPersonSaveResult === 'success' ? checker[0].contactPersonID : undefined,
            contactPersonContactID: contactPersonContactSaveResult === 'success' ? checker[0].contactPersonContactID : undefined,
            contactPersonRole: contactPersonRole,
            supplierType: supplierType,
            businessID: businessSaveResult === 'success' ? checker[0].businessID : undefined,
        })

        const supplierSaveResult = await supplierTable.update(["personID","contactID","addressID","contactPersonID","contactPersonContactID","contactPersonRole","supplierType","businessID"])

        if ( supplierSaveResult === "success") {

            callback({
                status: 'success',
                message: 'Supplier has been updated successfully',
                data: supplierSaveResult == 'success' ? supplierHiddenID : null
            })

        } else {

            callback({
                status: 'error',
                message: 'Failed to update Supplier',
            })

        }

    } else {
        console.log({
            status: "error",
            message: "Cannot update invalid supplier"
        })
    }
}


async function addBusiness(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {supplierType, supplierName, supplierPhone, supplierEmail, postalAddress, digitalAddress, macAddress, schemaName, contactPersonName, contactPersonPhoneNumber, contactPersonEmail, contactPersonGender, contactPersonRole, sessionID, supplierHiddenID} = body

    //check for required fields
    if (!supplierName || !supplierPhone || !supplierType || !supplierEmail || !digitalAddress || !postalAddress){
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const supplierTable = new SupplierTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)
    const businessTable = new BusinessTable(undefined, database, schemaName)
    const contactPersonContactTable = new ContactTable(undefined, database, schemaName)
    const businessSearchResult = await businessTable.get("uniqueCode = ? AND name = ?", [schemaName, supplierName], 1, 0)
        
    //returns Supplier already exists if supplier exists
    if (businessSearchResult.length > 0) {

        callback({ status: "exists", message: "Supplier already exists" })
        return

    } else {
        // setting values
        businessTable.setValues({
            uniqueCode: schemaName,
            name: supplierName,
            taxIdentificationNumber: undefined,
            smsDisplayName: undefined,
            contactID: undefined,
            addressID: undefined,
        })

        const businessSaveResult = await businessTable.save()

        contactTable.setValues({
            phone: supplierPhone ? supplierPhone : undefined,
            mobile: undefined,
            email: supplierEmail ? supplierEmail : undefined,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactSaveResult = await contactTable.save()

        contactPersonContactTable.setValues({
            phone: contactPersonPhoneNumber ? contactPersonPhoneNumber : undefined,
            mobile: undefined,
            email: contactPersonEmail ? contactPersonEmail : undefined,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactPersonContactSaveResult = await contactPersonContactTable.save()
        
        addressTable.setValues({
            postalAddress: postalAddress ? postalAddress : undefined,
            digitalAddress: digitalAddress ? digitalAddress : undefined,
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
            otherName: contactPersonNameArrangeResult.other ? contactPersonNameArrangeResult.other : undefined,
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

        supplierTable.setValues({
            personID: undefined,
            contactID: contactSaveResult.type === 'success' ? contactSaveResult.primaryKey : undefined,
            addressID: addressSaveResult.type === 'success' ? addressSaveResult.primaryKey : undefined,
            contactPersonID: contactPersonSaveResult.type === 'success' ? contactPersonSaveResult.primaryKey : undefined,
            contactPersonContactID: contactPersonContactSaveResult.type === 'success' ? contactPersonContactSaveResult.primaryKey : undefined,
            contactPersonRole: contactPersonRole,
            supplierType: supplierType,
            businessID: businessSaveResult.type === 'success' ? businessSaveResult.primaryKey : undefined,
            balance: 0,
            sessionID: sessionID ? sessionID : null
        })

        const supplierSaveResult = await supplierTable.save()

        if ( supplierSaveResult.type == 'success' ) {

            if (database && schemaName && sessionID && supplierSaveResult.primaryKey) {
                Notifier(database, socket, schemaName, sessionID, userID, supplierSaveResult.primaryKey, 'supplier', "added a new supplier", "added supplier "+ supplierName, 'newInsertAction', 'inventoryPrivilege', 'addNewSupplier')
            }
            callback({
                status: 'success',
                message: 'Supplier has been added successfully',
                data: supplierSaveResult.type == 'success' ? supplierSaveResult.primaryKey : null
            })
            socket.broadcast.emit(schemaName+'/inventory/supplier/insertUpdate', 'success')
            socket.emit(schemaName+'/inventory/supplier/insertUpdate', 'success')
    
        } else {
            callback({
                status: "error",
                message: 'Failed to add supplier'
            })
    
        }

    }

}

async function addSupplier(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {supplierType, supplierName, supplierPhone, supplierEmail, supplierGender, postalAddress, digitalAddress, supplierDOB, macAddress, schemaName, sessionID} = body
    
    const personTable = new PersonTable(undefined, database, schemaName)
    const supplierTable = new SupplierTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)

    
    const supplierSearchResult = await supplierTable.get("CONCAT(IFNULL(person.firstName, ''), ' ', IFNULL(person.lastName, '')) = ? AND contact.phone = ? ", [supplierName, supplierPhone], 1, 0)
    
    //returns Supplier already exists if supplier exists
    if (supplierSearchResult.length > 0) {

        callback({ status: "exists", message: "Supplier already exists" })
        return

    } else {

        const supplierNameArrangeResult = await arrangeName(supplierName ? supplierName : '')
        console.log(supplierNameArrangeResult);
        
        personTable.setValues({
            firstName: supplierNameArrangeResult.first,
            otherName: supplierNameArrangeResult.other,
            lastName: supplierNameArrangeResult.last,
            gender: supplierGender,
            dateOfBirth: supplierDOB,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const personSaveResult = await personTable.save()

        contactTable.setValues({
            phone: supplierPhone,
            mobile: undefined,
            email: supplierEmail,
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


        supplierTable.setValues({
            personID: personSaveResult.type === 'success' ? personSaveResult.primaryKey : 0,
            contactID: contactSaveResult.type === 'success' ? contactSaveResult.primaryKey : 0,
            addressID: addressSaveResult.type === 'success' ? addressSaveResult.primaryKey : 0,
            contactPersonID: undefined,
            contactPersonContactID: undefined,
            contactPersonAddressID: undefined,
            contactPersonRole: undefined,
            supplierType: supplierType,
            businessID: undefined,
            balance: 0,
            sessionID: sessionID ? sessionID : null
        })

        const supplierSaveResult = await supplierTable.save()

        if ( supplierSaveResult.type == 'success' ) {

            if (database && schemaName && sessionID && supplierSaveResult.primaryKey) {
                Notifier(database, socket, schemaName, sessionID, userID, supplierSaveResult.primaryKey, 'supplier', "added a new supplier", "added supplier "+ supplierName, 'newInsertAction', 'inventoryPrivilege', 'addNewSupplier')
            }
            callback({
                status: 'success',
                message: 'Supplier has been added successfully',
                data: supplierSaveResult.type == 'success' ? supplierSaveResult.primaryKey : null
            })
            socket.broadcast.emit(schemaName+'/inventory/supplier/insertUpdate', 'success')
            socket.emit(schemaName+'/inventory/supplier/insertUpdate', 'success')
    
        } else {
            callback({
                status: "error",
                message: 'Failed to add supplier'
            })
    
        }
    }
}


async function getSupplier(socket:Socket, database:MySQL.Connection|null, body:any, callback:any) {

    const {schemaName} = body

    const supplier = new SupplierTable(undefined, database, schemaName)

    const allSupplier = await supplier.getAll(10, 0)
    
    if ( allSupplier.length > 0) {
        
        callback({
            status: "success",
            data: allSupplier
        })

    } else {

        callback({
            status: "empty",
            message: "Supplier list is empty"
        })

    }

}


export default SupplierController
import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { arrangeName, authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import PersonTable from "../../../models/mainApp/default/PersonTable"
import CollectionPointTable from "../../../models/mainApp/laundry/CollectionPointTable"
import ContactTable from "../../../models/mainApp/default/ContactTable"

interface socketBody {
    collectionPoint?:string
    phone?:string|number
    contactPersonName?:string
    contactPersonPhoneNumber?:string
    contactPersonEmail?:string
    contactPersonGender?:string
    contactPersonRole?:string
    macAddress?:string
    schemaName?:string
    collectionPointHiddenID?:number
    sessionID:string|number
}

const CollectionPointController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.collectionPointHiddenID) {
                updateCollectionPoint(socket, database, body, callback, userID)
            } else {
                addCollectionPoint(socket, database, body, callback, userID)
            }
        } else if (controllerType === "fetch") {
            getCollectionPoint(socket, database, body, callback)
        }
    }
}

async function updateCollectionPoint(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    // get values
    const { schemaName, sessionID, collectionPointHiddenID, collectionPoint, phone, contactPersonName, contactPersonEmail, contactPersonPhoneNumber, contactPersonGender, contactPersonRole} = body

    if (!collectionPoint || !phone) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const collectionPointTable = new CollectionPointTable(undefined, database, schemaName)
    const contactPersonContactTable = new ContactTable(undefined, database, schemaName)

    const checker = await collectionPointTable.get("id = ?", [collectionPointHiddenID], 1, 0)
    if (checker.length > 0) {
        let contactPersonSaveResult, contactPersonContactSaveResult
        if (contactPersonName || contactPersonPhoneNumber || contactPersonGender) {
            const contactPersonNameArrangeResult = await arrangeName(contactPersonName ? contactPersonName : '')
            personTable.setValues({
                id: checker[0].contactPersonID,
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
            contactPersonSaveResult = await personTable.update(["firstName","dateOfBirth","gender","lastName","maritalStatus","nationalIdNumber","nationality","otherName","placeOfBirth","socialSecurityNumber","status"])
    
            contactPersonContactTable.setValues({
                id: checker[0].contactPersonContactID,
                phone: contactPersonPhoneNumber,
                mobile: undefined,
                email: contactPersonEmail,
                alternativeEmail: undefined,
                website: undefined,
                socialLinks: undefined,
            })
            contactPersonContactSaveResult = await contactPersonContactTable.update(["phone","mobile","email","alternativeEmail","website","socialLinks"])
        }

        collectionPointTable.setValues({
            id: checker[0].id,
            collectionPoint: collectionPoint,
            phone: phone,
            contactPersonID: contactPersonSaveResult === 'success' ? checker[0].contactPersonID : undefined,
            contactPersonContactID: contactPersonContactSaveResult === 'success' ? checker[0].contactPersonContactID : undefined,
            sessionID: sessionID ? sessionID : null,
        })
        const updateCollectionPointResult = await collectionPointTable.update(["collectionPoint", "phone"])
    
        if (updateCollectionPointResult === "success") {
            callback({
                status: "success",
                message: "Collection point has been updated successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to update collection point'
            })
        }

    } else {
        callback({
            status: "error",
            message: "Cannot update invalid collection point"
        })
    }
}

async function addCollectionPoint(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    // get values
    const { schemaName, sessionID, collectionPoint, phone, contactPersonName, contactPersonEmail, contactPersonPhoneNumber, contactPersonGender, contactPersonRole} = body

    if (!collectionPoint || !phone) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const collectionPointTable = new CollectionPointTable(undefined, database, schemaName)
    const contactPersonContactTable = new ContactTable(undefined, database, schemaName)

    let contactPersonSaveResult, contactPersonContactSaveResult
    if (contactPersonName || contactPersonPhoneNumber || contactPersonGender) {
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
        contactPersonSaveResult = await personTable.save()

        contactPersonContactTable.setValues({
            phone: contactPersonPhoneNumber,
            mobile: undefined,
            email: contactPersonEmail,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        contactPersonContactSaveResult = await contactPersonContactTable.save()
    }

    collectionPointTable.setValues({
        collectionPoint: collectionPoint,
        phone: phone,
        contactPersonID: contactPersonSaveResult?.type === 'success' ? contactPersonSaveResult.primaryKey : undefined,
        contactPersonContactID: contactPersonContactSaveResult?.type === 'success' ? contactPersonContactSaveResult.primaryKey : undefined,
        sessionID: sessionID ? sessionID : null,
    })

    const saveCollectionPointResult = await collectionPointTable.save()
    
    if (saveCollectionPointResult.type === "success") {
        callback({
            status: "success",
            message: "Collection point has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add collection point'
        })
    }

}

async function getCollectionPoint(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    const {schemaName} = body

    const collectionPointTable = new CollectionPointTable(undefined, database, schemaName)

    const allCollectionPoint = await collectionPointTable.getAll(10, 0)
    if ( allCollectionPoint.length > 0) {
        callback({
            status: "success",
            data: allCollectionPoint
        })
    } else {
        callback({
            status: "empty",
            message: "Collection point list is empty!"
        })
    }
}


export default CollectionPointController


import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { arrangeName, authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import WasteScheduleTable from "../../../models/mainApp/waste/WasteSchedule"
import PersonTable from "../../../models/mainApp/default/PersonTable"
import DriverTable from "../../../models/mainApp/waste/Driver"

interface socketBody {
    driverName?:string
    gender?:string
    licenseNumber?:string
    licenseExpiry?:string
    driverHiddenID?:number
    macAddress?:string
    schemaName?:string
    sessionID:string|number
}

const DriverController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.driverHiddenID) {
                updateExistingDriver(socket, database, body, callback, userID)
            } else {
                addNewDriver(socket, database, body, callback, userID)
            }
            
        } else if (controllerType === 'fetch') {
            getDrivers(socket, database, body, callback)
        }
    }
}

async function updateExistingDriver(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {driverName, gender, licenseNumber, licenseExpiry, schemaName, driverHiddenID} = body

    if (!driverName || !gender || !licenseNumber || !licenseExpiry) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const driverTable = new DriverTable(undefined, database, schemaName)
    const PersonNameArrangeResult = await arrangeName(driverName ? driverName : '')

    const checker = await driverTable.get("driver.id", [driverHiddenID], 1, 0)
    if (checker.length > 0) {
        personTable.setValues({
            id: checker[0].personID,
            firstName: PersonNameArrangeResult.first,
            otherName: PersonNameArrangeResult.other,
            lastName: PersonNameArrangeResult.last,
            gender: gender,
            dateOfBirth: undefined,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const personUpdateResult = await personTable.update(["firstName","dateOfBirth","gender","lastName","maritalStatus","nationalIdNumber","nationality","otherName","placeOfBirth","socialSecurityNumber","status"])
        
        driverTable.setValues({
            personID: checker[0].personID,
            licenseNumber: licenseNumber,
            licenseExpiry: licenseExpiry,
            status: 'active'
        })
    
        const driverSaveResult = await driverTable.update(["personID", "licenseNumber", "licenseExpiry", "status"])
        if (driverSaveResult === "success") {
            callback({
                status: "success",
                message: "driver has been updated successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to add driver'
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid driver!"
        })
    }
}

async function addNewDriver(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {driverName, gender, licenseNumber, licenseExpiry, schemaName, sessionID} = body

    if (!driverName || !gender || !licenseNumber || !licenseExpiry) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const personTable = new PersonTable(undefined, database, schemaName)
    const driverTable = new DriverTable(undefined, database, schemaName)
    const PersonNameArrangeResult = await arrangeName(driverName ? driverName : '')

    const checker = await driverTable.get("person.firstName = ? and person.otherName = ? and person.lastName = ? and driver.licenseNumber = ?", [PersonNameArrangeResult.first, PersonNameArrangeResult.other, PersonNameArrangeResult.last, licenseNumber], 1, 0)
    if (checker.length > 0) {
        callback({
            status: "exists",
            message: "A driver exists with the same details"
        })
        return
    }

    personTable.setValues({
        firstName: PersonNameArrangeResult.first,
        otherName: PersonNameArrangeResult.other,
        lastName: PersonNameArrangeResult.last,
        gender: gender,
        dateOfBirth: undefined,
        maritalStatus: undefined,
        placeOfBirth: undefined,
        nationality: undefined,
        nationalIdNumber: undefined,
        socialSecurityNumber: undefined,
    })
    const personSaveResult = await personTable.save()

    driverTable.setValues({
        personID: personSaveResult.type === "success" ? personSaveResult.primaryKey : null,
        licenseNumber: licenseNumber,
        licenseExpiry: licenseExpiry,
        sessionID: sessionID ? sessionID : null
    })

    const driverSaveResult = await driverTable.save()
    if (driverSaveResult.type === "success") {
        callback({
            status: "success",
            message: "driver has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add driver'
        })
    } 
}


async function getDrivers(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    const {schemaName} = body

    const driverTable = new WasteScheduleTable(undefined, database, schemaName)
    const allDrivers = await driverTable.getAll(10, 0)

    if (allDrivers.length > 0) {
        callback({
            status: "success",
            data: allDrivers
        })
    } else {
        callback({
            status: "error",
            message: 'Vehicle list is empty'
        })
    }

}

export default DriverController
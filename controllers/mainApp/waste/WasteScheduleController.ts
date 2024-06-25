import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import WasteScheduleTable from "../../../models/mainApp/waste/WasteSchedule"

interface socketBody {
    scheduleDate?:string
    vehicleID?:number
    driverID?:number
    assistantDriverID?:number
    categoryID?:string
    subCategoryID?:string
    janitorSupervisor?:string
    routineStatus?:string
    invoicedSubCategory?:string
    hiddenWasteScheduleID?:string|number
    macAddress?:string
    schemaName?:string
    sessionID:string|number
}

const WasteScheduleController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.hiddenWasteScheduleID) {
                updateExistingWasteSchedule(socket, database, body, callback, userID)
            } else {
                addNewWasteSchedule(socket, database, body, callback, userID)
            }
        } else if (controllerType === 'fetch') {
            get(socket, database, body, callback)
        }
    }
}


async function updateExistingWasteSchedule(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {scheduleDate, vehicleID, driverID, assistantDriverID, hiddenWasteScheduleID, categoryID, subCategoryID, janitorSupervisor, routineStatus, invoicedSubCategory, schemaName, sessionID} = body

    const wasteSchedule = new WasteScheduleTable(undefined, database, schemaName)
    const checker = await wasteSchedule.get("wasteSchedule.id = ?", [hiddenWasteScheduleID], 1, 0)
    if (checker.length > 0) {

        wasteSchedule.setValues({
            id: Number(hiddenWasteScheduleID),
            scheduleDate: scheduleDate,
            vehicleID: vehicleID,
            driverID: driverID,
            assistantDriverID: Number(assistantDriverID),
            categoryID: categoryID,
            subCategoryID: subCategoryID,
            janitorSupervisor: janitorSupervisor,
            routineStatus: routineStatus,
            invoicedSubCategory: invoicedSubCategory,
        })

        const wasteScheduleUpdateResult = await wasteSchedule.update(['scheduleDate','vehicleID','driverID','assistantDriverID','categoryID','subCategoryID','janitorSupervisor','routineStatus','invoicedSubCategory'])
        if (wasteScheduleUpdateResult === "success") {
            callback({
                status: "success",
                message: "Waste schedule has been added successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to add waste schedule'
            })
        }
    } callback({
        status: "error",
        message: "Cannot update invalid waste schedule!"
    })
}


async function addNewWasteSchedule(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {scheduleDate, vehicleID, driverID, assistantDriverID, categoryID, subCategoryID, janitorSupervisor, routineStatus, invoicedSubCategory, schemaName, sessionID} = body

    const wasteSchedule = new WasteScheduleTable(undefined, database, schemaName)
    const checker = await wasteSchedule.get("scheduleDate = ? and vehicleID = ? and driverID = ?", [scheduleDate, vehicleID, driverID], 1, 0)
    if (checker.length > 0) {
        callback({
            status: "exists",
            message: "A waste schedule exists with the same details"
        })
        return
    }
    
    wasteSchedule.setValues({
        scheduleDate: scheduleDate,
        vehicleID: vehicleID,
        driverID: driverID,
        assistantDriverID: Number(assistantDriverID),
        categoryID: categoryID,
        subCategoryID: subCategoryID,
        janitorSupervisor: janitorSupervisor,
        routineStatus: routineStatus,
        invoicedSubCategory: invoicedSubCategory,
    })
    const wasteScheduleSavedResult = await wasteSchedule.save()
    if (wasteScheduleSavedResult.type === "success") {
        callback({
            status: "success",
            message: "Waste schedule has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add waste schedule'
        })
    }
}


async function get(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    const {schemaName} = body

    const wasteSchedule = new WasteScheduleTable(undefined, database, schemaName)
    const allWasteSchedule = await wasteSchedule.getAll(10, 0)

    if (allWasteSchedule.length > 0) {
        callback({
            status: "success",
            data: allWasteSchedule
        })
    } else {
        callback({
            status: "error",
            message: 'all waste schedule list is empty'
        })
    }

}

export default WasteScheduleController
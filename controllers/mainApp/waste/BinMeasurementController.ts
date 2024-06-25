import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import WasteScheduleTable from "../../../models/mainApp/waste/WasteSchedule"
import BinMeasurementTable from "../../../models/mainApp/waste/BinMeasurement"

interface socketBody {
    size?:string
    type?:string
    description?:string
    hiddenBinID?:number
    macAddress?:string
    schemaName?:string
    sessionID:string|number
}

const BinMeasurementController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.hiddenBinID) {
                updateExistingBin(socket, database, body, callback, userID)
            } else {
                addNewBin(socket, database, body, callback, userID)
            }
        } else if (controllerType === 'fetch') {
            getBin(socket, database, body, callback, userID)
        }
    }
}

async function updateExistingBin(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {size, type, description, schemaName, sessionID, hiddenBinID} = body

    if (!size || !type) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const bin = new BinMeasurementTable(undefined, database, schemaName)
    const checker = await bin.get("id = ?", [hiddenBinID], 1, 0)
    if (checker.length > 0) {
        bin.setValues({
            id: checker[0].id,
            size: size,
            type: type,
            description: description ? description : undefined,
            sessionID: sessionID ? sessionID : null
        })
    
        const binSavedResult = await bin.update(["size","type", "description"])
        if (binSavedResult === "success") {
            callback({
                status: "success",
                message: "Bin has been updated successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to update Bin'
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid bin measurement!"
        })
    }
}

async function addNewBin(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {size, type, description, schemaName, sessionID} = body

    if (!size || !type) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const bin = new BinMeasurementTable(undefined, database, schemaName)
    const checker = await bin.get("size = ? and type = ?", [size, type], 1, 0)
    if (checker.length) {
        callback({
            status: "exists",
            message: "A Bin exists with the same size and type"
        })
        return
    }
    bin.setValues({
        size: size,
        type: type,
        description: description ? description : undefined,
        sessionID: sessionID ? sessionID : null
    })

    const binSavedResult = await bin.save()
    if (binSavedResult.type === "success") {
        callback({
            status: "success",
            message: "Bin has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add bin'
        })
    }
}


async function getBin(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {schemaName} = body

    const bin = new BinMeasurementTable(undefined, database, schemaName)
    const allBin = await bin.getAll(10, 0)

    if (allBin.length > 0) {
        callback({
            status: "success",
            data: allBin
        })
    } else {
        callback({
            status: "error",
            message: 'Bin list is empty'
        })
    }
}

export default BinMeasurementController
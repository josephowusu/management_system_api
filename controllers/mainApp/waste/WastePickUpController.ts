import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import WasteScheduleTable from "../../../models/mainApp/waste/WasteSchedule"
import WastePickUpTable from "../../../models/mainApp/waste/WastePickUpTable"

interface socketBody {
    wasteScheduleID?:string|number
    clientID?:string|number
    code?:string
    longitude?:string
    latitude?:string
    binMeasurementID?:string|number
    amount?:string|number
    description?:string
    hiddenWastePickUpID?:string|number
    macAddress?:string
    schemaName?:string
    sessionID:string|number
}

const WastePickUpController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.hiddenWastePickUpID){
                updateExistingWastePickup(socket, database, body, callback, userID)
            } else {
                addNewWastePickup(socket, database, body, callback, userID)
            }
        } else if (controllerType === 'fetch') {
            get(socket, database, body, callback, userID)
        }
    }
}

async function updateExistingWastePickup(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {wasteScheduleID, clientID, code, hiddenWastePickUpID, longitude, schemaName,latitude, binMeasurementID, amount, description, sessionID} = body

    if (!wasteScheduleID || !clientID || !code || !longitude || !latitude || !binMeasurementID || !amount) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const wastePickUp = new WastePickUpTable(undefined, database, schemaName)
    const checker = await wastePickUp.get("id = ?", [hiddenWastePickUpID], 1, 0)
    if (checker.length > 0) {
        wastePickUp.setValues({
            id: Number(hiddenWastePickUpID),
            wasteScheduleID: wasteScheduleID,
            clientID: clientID,
            code: code,
            longitude: longitude,
            latitude: latitude,
            binMeasurementID: binMeasurementID,
            amount: Number(amount),
        })
        const updateWastePickUpResult = await wastePickUp.update(["wasteScheduleID","clientID","code", "longitude","latitude","binMeasurementID","amount"])
        if (updateWastePickUpResult === "success") {
            callback({
                status: "success",
                message: "Waste pickup has been updated successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to add waste pickup'
            })
        }
    } callback({
        status: "error",
        message: "Cannot update invalid waste pickup!"
    })
}

async function addNewWastePickup(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {wasteScheduleID, clientID, code, longitude, schemaName,latitude, binMeasurementID, amount, description, sessionID} = body

    if (!wasteScheduleID || !clientID || !code || !longitude || !latitude || !binMeasurementID || !amount) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const wastePickUp = new WastePickUpTable(undefined, database, schemaName)
    const checker = await wastePickUp.get("wasteScheduleID = ? and clientID = ? and longitude = ? and latitude = ? and amount = ?", [wasteScheduleID, clientID, longitude, latitude, amount], 1, 0)

    if (checker.length > 0) {
        callback({
            status: "exists",
            message: "A waste pickup exists with the same details"
        })
        return
    }

    wastePickUp.setValues({
        wasteScheduleID: wasteScheduleID,
        clientID: clientID,
        code: code,
        longitude: longitude,
        latitude: latitude,
        binMeasurementID: binMeasurementID,
        amount: Number(amount),
    })

    const saveWastePickUpResult = await wastePickUp.save()
    if (saveWastePickUpResult.type === "success") {
        callback({
            status: "success",
            message: "Waste pickup has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add waste pickup'
        })
    }

}


async function get(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {schemaName} = body

    const wastePickup = new WasteScheduleTable(undefined, database, schemaName)
    const allWastePickup = await wastePickup.getAll(10, 0)

    if (allWastePickup.length > 0) {
        callback({
            status: "success",
            data: allWastePickup
        })
    } else {
        callback({
            status: "error",
            message: 'Vehicle list is empty'
        })
    }
}

export default WastePickUpController
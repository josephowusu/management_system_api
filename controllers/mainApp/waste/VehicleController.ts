import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import WasteScheduleTable from "../../../models/mainApp/waste/WasteSchedule"
import VehicleTable from "../../../models/mainApp/waste/Vehicle"

interface socketBody {
    type?:string
    model?:string
    numberPlate?:string
    brand?:string
    hiddenVehicleID?:number
    macAddress?:string
    schemaName?:string
    sessionID:string|number
}

const VehicleController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.hiddenVehicleID) {
                updateExistingVehicle(socket, database, body, callback, userID)
            } else {
                addNewVehicle(socket, database, body, callback, userID)
            }
        } else if (controllerType === 'fetch') {
            getVehicle(socket, database, body, callback, userID)
        }
    }
}

async function updateExistingVehicle(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {type, model, numberPlate, brand, schemaName, hiddenVehicleID, sessionID} = body

    if (!type || !model || !numberPlate || !brand) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const vehicle = new VehicleTable(undefined, database, schemaName)
    const checker = await vehicle.get("id = ?", [hiddenVehicleID], 1, 0)
    if (checker.length > 0) {
        vehicle.setValues({
            id: hiddenVehicleID,
            type: type,
            model: model,
            numberPlate: numberPlate,
            brand: brand,
            sessionID: sessionID ? sessionID : null
        })
    
        const saveVehicleResult = await vehicle.update(["type","model","numberPlate","brand"])
        if (saveVehicleResult === "success") {
            callback({
                status: "success",
                message: "Vehicle has been updated successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to add vehicle'
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid vehicle!"
        })
    }
}

async function addNewVehicle(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {type, model, numberPlate, brand, schemaName, sessionID} = body

    if (!type || !model || !numberPlate || !brand) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const vehicle = new VehicleTable(undefined, database, schemaName)
    const checker = await vehicle.get("type = ? and model = ? and numberPlate = ?", [type, model, numberPlate], 1, 0)
    if (checker.length > 0) {
        callback({
            status: "exists",
            message: "A vehicle exists with the same type, model and number plate"
        })
        return
    }

    vehicle.setValues({
        type: type,
        model: model,
        numberPlate: numberPlate,
        brand: brand,
        sessionID: sessionID ? sessionID : null
    })

    const saveVehicleResult = await vehicle.save()
    if (saveVehicleResult.type === "success") {
        callback({
            status: "success",
            message: "Vehicle has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add laundry'
        })
    }
}


async function getVehicle(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
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
            message: 'Vehicle list is empty'
        })
    }

}

export default VehicleController
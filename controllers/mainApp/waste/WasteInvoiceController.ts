import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import WasteScheduleTable from "../../../models/mainApp/waste/WasteSchedule"
import VehicleTable from "../../../models/mainApp/waste/Vehicle"
import WasteInvoiceTable from "../../../models/mainApp/waste/WasteInvoice"

interface socketBody {
    clientID?:string|number
    date?:string
    wasteCategoryID?:string|number
    amount?:number
    quantity?:number
    hiddenWasteInvoiceID?:number
    macAddress?:string
    schemaName?:string
    sessionID:string|number
}

const WasteInvoiceController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.hiddenWasteInvoiceID) {
                updateExistingVehicle(socket, database, body, callback, userID)
            } else {
                addNewWasteInvoice(socket, database, body, callback, userID)
            }
        } else if (controllerType === 'fetch') {
            getWasteInvoices(socket, database, body, callback, userID)
        }
    }
}

async function updateExistingVehicle(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {clientID, date, wasteCategoryID, amount, quantity, hiddenWasteInvoiceID, sessionID, schemaName} = body

    if (!clientID || !date || !wasteCategoryID || !amount || !quantity) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const wasteInvoice = new WasteInvoiceTable(undefined, database, schemaName)

    const checker = await wasteInvoice.get("wasteInvoice.id = ?", [hiddenWasteInvoiceID], 1, 0)
    if (checker.length > 0) {
        wasteInvoice.setValues({
            id: hiddenWasteInvoiceID,
            clientID: Number(clientID),
            date: date,
            wasteCategoryID: wasteCategoryID ? Number(wasteCategoryID) : null,
            amount: amount,
            quantity: quantity,
            sessionID: sessionID ? sessionID : null
        })

        const updateVehicleResult = await wasteInvoice.update(["clientID","date","wasteCategoryID","amount", "quantity"])
        if (updateVehicleResult === "success") {
            callback({
                status: "success",
                message: "Waste invoice has been updated successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to add waste invoice'
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid waste invoice!"
        })
    }
}

async function addNewWasteInvoice(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {clientID, date, wasteCategoryID, amount,quantity, sessionID, schemaName} = body

    if (!clientID || !date || !wasteCategoryID || !amount || !quantity) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const wasteInvoice = new WasteInvoiceTable(undefined, database, schemaName)

    wasteInvoice.setValues({
        clientID: Number(clientID),
        date: date,
        wasteCategoryID: wasteCategoryID ? Number(wasteCategoryID) : null,
        amount: amount,
        quantity: quantity,
        sessionID: sessionID ? sessionID : null
    })

    const saveWasteInvoiceResult = await wasteInvoice.save()
    if (saveWasteInvoiceResult.type === "success") {
        callback({
            status: "success",
            message: "Waste invoice has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add waste invoice'
        })
    }
}


async function getWasteInvoices(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {schemaName} = body

    const wasteInvoice = new WasteInvoiceTable(undefined, database, schemaName)
    const allWasteInvoice = await wasteInvoice.getAll(10, 0)

    if (allWasteInvoice.length > 0) {
        callback({
            status: "success",
            data: allWasteInvoice
        })
    } else {
        callback({
            status: "error",
            message: 'Waste invoice list is empty'
        })
    }

}

export default WasteInvoiceController
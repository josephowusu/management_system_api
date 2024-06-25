import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import DailyActivitiesTable from "../../../models/mainApp/laundry/LaundryTable"

interface socketBody {
    employeeID?:string|number
    activityDate?:string
    invoice?:string
    accessory?:string
    quantity?:number
    macAddress?:string
    schemaName?:string
    laundryHiddenID?:number
    sessionID:string|number
}

const LaundryController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
            if (body.laundryHiddenID) {
                updateLaundry(socket, database, body, callback, userID)
            } else {
                addLaundry(socket, database, body, callback, userID)
            }
        } else if (controllerType === "fetch") {
            getLaundry(socket, database, body, callback)
        }
    }
}

async function updateLaundry(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {employeeID, activityDate, invoice, accessory, quantity, laundryHiddenID, schemaName} = body
    
    if (!employeeID || !activityDate || !invoice || !quantity) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const dailyActivitiesTable = new DailyActivitiesTable(undefined, database, schemaName)

    const checker = await dailyActivitiesTable.get("id = ?", [laundryHiddenID], 1, 0)

    if (checker.length > 0) {

        dailyActivitiesTable.setValues({
            id: checker[0].id,
            employeeID: employeeID,
            activityDate: activityDate,
            invoice: invoice,
            accessory: accessory ? accessory : undefined,
            quantity: quantity,
        })
    
        const updateDailyActivitiesTableResult = await dailyActivitiesTable.update(["employeeID","activityDate","invoice","accessory","quantity","status"])
    
        if (updateDailyActivitiesTableResult === "success"){
            callback({
                status: "success",
                message: "Laundry has been updated successfully"
            })
        } else {
            callback({
                status: "error",
                message: 'Failed to update laundry'
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid laundry"
        })
    }
}

async function addLaundry(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {employeeID, activityDate, invoice, accessory, quantity, schemaName, sessionID} = body

    if (!employeeID || !activityDate || !invoice || !quantity) {
        callback({status: "error", message: "Some fields are required!"})
        return
    }

    const dailyActivitiesTable = new DailyActivitiesTable(undefined, database, schemaName)

    dailyActivitiesTable.setValues({
        employeeID: employeeID,
        activityDate: activityDate,
        invoice: invoice,
        accessory: accessory ? accessory : undefined,
        quantity: quantity,
    })

    const savedDailyActivitiesResult = await dailyActivitiesTable.save()

    if (savedDailyActivitiesResult.type === "success"){
        callback({
            status: "success",
            message: "Laundry has been added successfully"
        })
    } else {
        callback({
            status: "error",
            message: 'Failed to add laundry'
        })
    }
}

async function getLaundry(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    const {schemaName} = body
    const dailyActivitiesTable = new DailyActivitiesTable(undefined, database, schemaName)
    const allDailyActivities = await dailyActivitiesTable.getAll(10, 0)
    if ( allDailyActivities.length > 0) {
        callback({
            status: "success",
            data: allDailyActivities
        })
    } else {
        callback({
            status: "empty",
            message: "Collection point list is empty!"
        })
    }
}


export default LaundryController


import MySQL from "mysql"
import { Socket } from "socket.io"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import BulkSMSTable from "../../../models/mainApp/crm/BulkSMSTable"

interface socketBody {
    numbers?:string
    message?:string
    macAddress?:string
    schemaName?:string
    sessionID:string|number
}

const BulkSMSController = async (controllerType:'sendBulkSMS'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
        if (controllerType === 'sendBulkSMS') {
            if (privileges.CRM?.sendBulkSMS == 'yes') {
                sendSMS(socket, database, body, callback, userID)
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

async function sendSMS(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    //get body variables
    let sent:any = [], fails:any = [] 
    const { numbers, message, schemaName, sessionID } = body
    const bulkSMS = new BulkSMSTable(undefined, database, schemaName)
    // {sendSMS here}
    //
    if (!numbers || !message) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    bulkSMS.setValues({
        numbers: JSON.stringify(numbers),
        message: message,
        sessionID: sessionID
    })

    const savedBulkSMSSendOut = await bulkSMS.save()

    if (savedBulkSMSSendOut.type === "success") {
        callback({
            status: "success",
            message: "SMS Sent successfully"
        })
    } else {
        callback({
            status: "error",
            message: `Failed to send to ${fails}`
        })
    }
}

export default BulkSMSController
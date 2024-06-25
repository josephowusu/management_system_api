import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import { authenticateSession, fullDateTime } from "../../modules/GeneralModules"
import SessionTable from "../../models/mainApp/default/SessionTable"

interface socketBody {
    logoutType?:string
    macAddress?:string
    schemaName?:string
    sessionID?:number|string
}

const LogOutController = async (controllerType:'logout', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {

    if ( !body.macAddress || !body.schemaName){
        callback({status: "error", message: "Missing important parameter. Contact system administrator for support!"})
        return
    }

    const isSession = await authenticateSession(socket, database, body.macAddress ? body.macAddress : '', body.schemaName ? body.schemaName : '', body.sessionID ? body.sessionID : '')

    if (isSession.type === 'success') {

        if (controllerType === 'logout') {

            const sessionTable = new SessionTable(undefined, database, body.schemaName)
            let date = fullDateTime()
            sessionTable.setValues({
                id: Number(isSession.data?.sessionID),
                logoutDateAndTime: date,
                logoutType: body.logoutType,
            })

            const logoutSessionResult = await sessionTable.update(["logoutDateAndTime","logoutType"])
    
            if (logoutSessionResult === "success") {
                
                callback({
                    status: 'success',
                    message: 'Your account was successfully logged out',
                })
    
            } else {
    
                callback({
                    status: "error",
                    message: "Failed to logout"
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

export default LogOutController
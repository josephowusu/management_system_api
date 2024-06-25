import MySQL from "mysql"
import { Socket } from "socket.io"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import RoleTable from "../../../models/mainApp/hr/RoleTable"


interface socketBody {
    name?:string
    description?:string
    macAddress?:string
    schemaName?:string
    roleHiddenID?:number
    sessionID?:string|number
}

const RoleController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.roleHiddenID) {
                if (privileges.HR?.updateExistingRole == 'yes'){
                    updateRole(socket, database, body, callback)
                }

            } else{
                if (privileges.HR?.addNewRole == 'yes'){
                    addRole(socket, database, body, callback)
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.HR?.addNewRole == 'yes' || 
            privileges.HR?.updateExistingRole == 'yes' || 
            privileges.HR?.deactivateExistingRole == 'yes' ||
            privileges.HR?.deleteExistingRole == 'yes') {
                getRole(socket, database, body, callback)
            }
        }
    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}

async function addRole(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const {name, description, macAddress, schemaName, sessionID} = body

    //check if name is empty
    if (!name) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const role = new RoleTable

    const checkRole = await role.get("name = ?", [name], 1, 0)

    if(checkRole.length > 0) {

        callback({
            status: "exists",
            message: "Sorry, role with the same name exist"
        })
        return

    }
    
    role.setValues({
        name: name,
        description: description,
        sessionID: sessionID 
    })

    const roleSaveResult = await role.save()

    if ( roleSaveResult.type == 'success' ) {

        callback({
            status: "success",
            message: "Role has been created successfully"
        })

    } else {

        callback({
            status: "error",
            message: roleSaveResult
        })

    }
}

async function updateRole(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    
    const {name, description, macAddress, schemaName, roleHiddenID, sessionID } = body 

    //check if name is empty
    if (!name) {
        callback.status(200).json({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const role = new RoleTable()

    //updating service  
    role.setValues({
        id: roleHiddenID,
        name: name,
        description: description,
        sessionID: sessionID 
    })

    const roleSaveResult = await role.update(["name", "description"])

    if ( roleSaveResult == "success" ) {

        callback.status(200).json({
            status: "success",
            message: "Role has been updated successfully"
        })

    } else {

        callback.status(200).json({
            status: "error",
            message: roleSaveResult
        })

    }

}

async function getRole(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const {macAddress, schemaName, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found"
        })
        return
    }


    const role = new RoleTable(undefined, database, schemaName)

    const allRole = await role.getAll(10, 0)

    if ( allRole.length > 0) {

        callback({
            status: "success",
            data: allRole
        })

    } else {

        callback({
            status: "empty",
            message: "Role list is empty"
        })

    }

}


export default RoleController
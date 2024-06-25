import MySQL from "mysql"
import { Socket } from "socket.io"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import AssignRoleTable from "../../../models/mainApp/hr/AssignRoleTable"

interface socketBody {
    employeeID?:string|number
    roleID?:string|number
    description?:string
    macAddress?:string
    schemaName?:string
    assignRoleHiddenID?:number
    sessionID?:string|number
}

const AssignRoleController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.assignRoleHiddenID) {
                if (privileges.HR?.updateExistingAssignRole == 'yes'){
                    updateAssignRole(socket, database, body, callback)
                }

            } else{
                if (privileges.HR?.addNewAssignRole == 'yes'){
                    addAssignRole(socket, database, body, callback)
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.HR?.addNewAssignRole == 'yes' || 
            privileges.HR?.updateExistingAssignRole == 'yes' || 
            privileges.HR?.deactivateExistingAssignRole == 'yes' ||
            privileges.HR?.deleteExistingAssignRole == 'yes') {
                getAssignRole(socket, database, body, callback)
            }
        }
    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}

async function addAssignRole(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const {employeeID, roleID, description, macAddress, schemaName, sessionID} = body

    //check if name is empty
    if (!employeeID || !roleID) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const assignRole = new AssignRoleTable

    const checkAssignRole = await assignRole.get("employeeID = ? AND roleID = ?", [employeeID, roleID], 1, 0)

    if(checkAssignRole.length > 0) {

        callback({
            status: "exists",
            message: "Sorry,assign role with the same details exist"
        })
        return

    }
    
    assignRole.setValues({
        employeeID: employeeID,
        roleID: roleID,
        description: description,
        sessionID: sessionID 
    })

    const assignRoleSaveResult = await assignRole.save()

    if (assignRoleSaveResult.type == 'success' ) {

        callback({
            status: "success",
            message: "Assign role has been created successfully"
        })

    } else {

        callback({
            status: "error",
            message: assignRoleSaveResult
        })

    }
}

async function updateAssignRole(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    
    const {employeeID, roleID, description, macAddress, schemaName, assignRoleHiddenID, sessionID } = body 

    //check if name is empty
    if (!employeeID || !roleID) {
        callback.status(200).json({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const assignRole = new AssignRoleTable()

    //updating service  
    assignRole.setValues({
        id: assignRoleHiddenID,
        employeeID: employeeID,
        roleID: roleID,
        description: description,
        sessionID: sessionID 
    })

    const assignRoleSaveResult = await assignRole.update(["employeeID", "roleID", "description"])

    if ( assignRoleSaveResult == "success" ) {

        callback.status(200).json({
            status: "success",
            message: "Assign role has been updated successfully"
        })

    } else {

        callback.status(200).json({
            status: "error",
            message: assignRoleSaveResult
        })

    }

}

async function getAssignRole(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const {macAddress, schemaName, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found"
        })
        return
    }


    const assignRole = new AssignRoleTable(undefined, database, schemaName)

    const allAssignRole = await assignRole.getAll(10, 0)

    if ( allAssignRole.length > 0) {

        callback({
            status: "success",
            data: allAssignRole
        })

    } else {

        callback({
            status: "empty",
            message: "Assign Role list is empty"
        })

    }

}

export default AssignRoleController
import MySQL from "mysql"
import { Socket } from "socket.io"
import ClientCategoryTable from "../../../models/mainApp/crm/ClientCategoryTable"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    name?:string
    description?:string
    color?:string
    dependency?:string|number
    macAddress?:string
    schemaName?:string
    clientCategoryHiddenID?:number
    sessionID:string|number
}

const ClientCategoryController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.clientCategoryHiddenID) {
                if (privileges.CRM?.updateExistingClientCategory == 'yes'){
                    updateClientCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            } else {
                if (privileges.CRM?.addNewClientCategory == 'yes'){
                    addClientCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            }

        } else if (controllerType === 'fetch') {
            if (privileges.CRM?.addNewClientCategory == 'yes' || 
            privileges.CRM?.updateExistingClientCategory == 'yes' || 
            privileges.CRM?.deactivateExistingClientCategory == 'yes' ||
            privileges.CRM?.deleteExistingClientCategory == 'yes') {
                getClientCategory(socket, database, body, callback)
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

async function addClientCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {name, description, color, schemaName, dependency, sessionID} = body
    //check if name is empty
    if (!name) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const clientCategory = new ClientCategoryTable(undefined, database, schemaName)
    const checkClientCategory = await clientCategory.get("categoryName = ?", [name], 1, 0)
    if(checkClientCategory.length > 0) {
        callback({
            status: "exists",
            message: "A client category with same name exists"
        })
        return
    }
    
    clientCategory.setValues({
        name: name,
        color: color ? color : "255,255,255",
        dependency: dependency ? Number(dependency) : undefined,
        description: description,
        sessionID: sessionID ? sessionID : null
    })

    const clientCategorySaveResult = await clientCategory.save()

    if ( clientCategorySaveResult.type == 'success' ) {
        if (database && schemaName && sessionID && clientCategorySaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, clientCategorySaveResult.primaryKey, 'clientCategory', "added a new client category", "added client category "+ name, 'newInsertAction', 'crmPrivilege', 'addNewClientCategory')
        }
        callback({
            status: 'success',
            message: 'Client category has been added successfully',
            data: clientCategorySaveResult.type == 'success' ? clientCategorySaveResult.primaryKey : null
        })
        socket.broadcast.emit(schemaName+'/crmCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/crmCategory/insertUpdate', 'success')

    } else {
        callback({
            status: "error",
            message: 'Failed to add client category'
        })
    }
}


async function updateClientCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {name, description, color, schemaName, dependency, clientCategoryHiddenID, sessionID } = body 
    //check if name is empty
    if (!name || !description || !color) {
        callback.status(200).json({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const clientCategory = new ClientCategoryTable(undefined, database, schemaName)
    //updating client category  
    clientCategory.setValues({
        id: clientCategoryHiddenID,
        name: name,
        color: color,
        dependency: Number(dependency),
        description: description,
        sessionID: sessionID ? sessionID : null
    })

    const clientCategorySaveResult = await clientCategory.update(["name", "color", "description"])

    if ( clientCategorySaveResult == "success" ) {
        if (database && schemaName && sessionID && clientCategoryHiddenID) {
            Notifier(database, socket, schemaName, sessionID, userID, clientCategoryHiddenID, 'clientCategory', "updated a client category", "updated an existing client category", "updateAction", 'crmPrivilege', 'updateExistingClientCategory')
        }
        callback({
            status: "success",
            message: "Client has been updated successfully"
        })
        socket.broadcast.emit(schemaName+'/crmCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/crmCategory/insertUpdate', 'success')
    } else {

        callback({
            status: "error",
            message: 'Failed to update client'
        })
    }
}


async function getClientCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const { schemaName } = body

    const clientCategory = new ClientCategoryTable(undefined, database, schemaName)

    const allClientCategory = await clientCategory.getAll(10, 0)
    if ( allClientCategory.length > 0) {
        callback({
            status: "success",
            data: allClientCategory
        })
    } else {
        callback({
            status: "empty",
            message: "Client category list empty"
        })
    }
}

export default ClientCategoryController
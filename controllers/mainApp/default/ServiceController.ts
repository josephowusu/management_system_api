import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import ServiceTable from "../../../models/mainApp/default/ServiceTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "./AuthenticateController"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    name?:string
    description?:string
    macAddress?:string
    schemaName?:string
    serviceHiddenID?:number
    sessionID?:number|string|undefined
}

const ServiceController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.serviceHiddenID) {
                if (privileges.Default?.updateExistingService == 'yes') {
                    updateService(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
        
            } else {
                if (privileges.Default?.addNewService == 'yes') {
                    addService(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
        
            }

        } else if (controllerType === 'fetch') {
            if (privileges.Default?.addNewService == 'yes' || 
            privileges.Default?.updateExistingService == 'yes' || 
            privileges.Default?.deactivateExistingService == 'yes' ||
            privileges.Default?.deleteExistingService == 'yes') {
                getService(socket, database, body, callback)
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

async function addService(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, name, description, sessionID } = body

    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const service = new ServiceTable(undefined, database, schemaName)

    const checkService = await service.get("name = ?", [name], 1, 0)

    if(checkService.length > 0) {
        callback({
            status: "exists",
            message: "A service exists with the same name"
        })
        return
    }
        
    service.setValues({
        name: name,
        description: description,
        sessionID: sessionID
    })

    const serviceSaveResult = await service.save()

    if ( serviceSaveResult.type == 'success' ) {

        if (database && schemaName && sessionID && serviceSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, serviceSaveResult.primaryKey, 'service', "added a new service", "added service "+name, 'newInsertAction', 'defaultPrivilege', 'addNewService')
        }
        callback({
            status: "success",
            message: "Service has been added successfully"
        })
        socket.broadcast.emit(schemaName+'/service/insertUpdate', 'success')
        socket.emit(schemaName+'/service/insertUpdate', 'success')

    } else {
        callback({
            status: "error",
            message: serviceSaveResult
        })

    }
}


async function updateService(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, name, description, sessionID, serviceHiddenID } = body
    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const service = new ServiceTable()
    const checker  = await service.get("service.id = ?", [serviceHiddenID], 1, 0)

    if (checker.length > 0) {
        //updating service  
        service.setValues({
            id: serviceHiddenID,
            name: name,
            description: description,
            sessionID: sessionID
        })
        const serviceSaveResult = await service.update(["name", "description", "sessionID"])
        if ( serviceSaveResult == "success" ) {
            if (database && schemaName && sessionID && serviceHiddenID) {
                Notifier(database, socket, schemaName, sessionID, userID, serviceHiddenID, 'service', "updated a service", "updated an existing service", "updateAction", 'defaultPrivilege', 'updateExistingService')
            }
            callback({
                status: "success",
                message: "Service added successfully"
            })
            socket.broadcast.emit(schemaName+'/service/insertUpdate', 'success')
            socket.emit(schemaName+'/service/insertUpdate', 'success')
        } else {
            callback({
                status: "error",
                message: serviceSaveResult
            })
        }
    } else {
        console.log({
            status: "error",
            message: "Cannot update invalid service"
        })
    }
}



async function getService(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const { schemaName } = body
    const service = new ServiceTable(undefined, database, schemaName)
    const allService = await service.getAll(10, 0)

    if ( allService.length > 0) {
        callback({
            status: "success",
            data: allService
        })
    } else {
        callback({
            status: "empty",
            message: "Service list empty"
        })
    }
}


export default ServiceController
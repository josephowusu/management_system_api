import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import ServiceTable from "../../../models/mainApp/default/ServiceTable"
import ManufacturerTable from "../../../models/mainApp/default/ManufacturerTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "./AuthenticateController"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    name?:string
    color?:string
    description?:string
    macAddress?:string
    schemaName?:string
    serviceHiddenID?:number
    sessionID?:number|string
}

const ManufaturerController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
                if (privileges.Default?.updateExistingManufacturer == 'yes') {
                    updateService(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
        
            } else {
                if (privileges.Default?.addNewManufacturer == 'yes') {
                    addManufacturer(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.Default?.addNewManufacturer == 'yes' || 
            privileges.Default?.updateExistingManufacturer == 'yes' || 
            privileges.Default?.deactivateExistingManufacturer == 'yes' ||
            privileges.Default?.deleteExistingManufacturer == 'yes') {
                getManufacturer(socket, database, body, callback)
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

async function addManufacturer(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {macAddress, schemaName, name, color, description, sessionID } = body
    //check if name is empty
    if (!name) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const manufacturer = new ManufacturerTable(undefined, database, schemaName)
    const checkManufacturer = await manufacturer.get("name = ?", [name], 1, 0)
    if(checkManufacturer.length > 0) {
        callback({
            status: "exists",
            message: "A service exists with the same name"
        })
        return
    }
        
    manufacturer.setValues({
        name: name,
        color: color,
        description: description,
        sessionID: sessionID
    })

    const manufacturerSaveResult = await manufacturer.save()

    if ( manufacturerSaveResult.type == 'success' ) {
        if (database && schemaName && sessionID && manufacturerSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, manufacturerSaveResult.primaryKey, 'manufacturer', "added a new manufacturer", "added manufacturer "+ name, 'newInsertAction', 'defaultPrivilege', 'addNewManufacturer')
        }
        callback({
            status: "success",
            message: "Manufacturer has been added successfully!"
        })
        socket.broadcast.emit(schemaName+'/manufacturer/insertUpdate', 'success')
        socket.emit(schemaName+'/manufacturer/insertUpdate', 'success')
    } else {
        callback({
            status: "error",
            message: "Failed to add manufacturer!"
        })
    }

}


async function updateService(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {macAddress, schemaName, name, description, sessionID, serviceHiddenID } = body

    //check if name is empty
    if (!name) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const service = new ServiceTable()

    //updating service  
    service.setValues({
        id: serviceHiddenID,
        name: name,
        description: description,
        sessionID: sessionID ? sessionID : null
    })

    const serviceSaveResult = await service.update(["name", "description", "sessionID"])

    if ( serviceSaveResult == "success" ) {
        if (database && schemaName && sessionID && serviceHiddenID) {
            Notifier(database, socket, schemaName, sessionID, userID, serviceHiddenID, 'manufacturer', "updated an existing manufacturer", "updated manufacturer ", 'updateAction', 'defaultPrivilege', 'updateExistingManufacturer')
        }
        callback({
            status: "success",
            message: "Manufacturer has been updated successfully!"
        })
        socket.broadcast.emit(schemaName+'/manufacturer/insertUpdate', 'success')
        socket.emit(schemaName+'/manufacturer/insertUpdate', 'success')
    } else {
        callback({
            status: "error",
            message: serviceSaveResult
        })
    }

}




async function getManufacturer(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {schemaName, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found"
        })
        return
    }

    const manufacturer = new ManufacturerTable(undefined, database, schemaName)

    const allManufacturers = await manufacturer.getAll(10, 0)

    if ( allManufacturers.length > 0) {

        callback({
            status: "success",
            data: allManufacturers
        })

    } else {

        callback({
            status: "empty",
            message: "Manufacturer list empty"
        })

    }

}



export default ManufaturerController
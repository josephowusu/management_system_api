import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import ServiceTable from "../../../models/mainApp/default/ServiceTable"
import ManufacturerTable from "../../../models/mainApp/default/ManufacturerTable"
import DepartmentTable from "../../../models/mainApp/default/DepartmentTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "./AuthenticateController"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    name?:string
    color?:string
    description?:string
    macAddress?:string
    schemaName?:string
    departmentHiddenID?:number
    sessionID?:number|string
}

const DepartmentController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.departmentHiddenID) {
                if (privileges.Default?.updateExistingDepartment == 'yes') {
                    updateDepartment(socket, database, body, callback, userID)
                }else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
        
            } else {
                if (privileges.Default?.addNewDepartment == 'yes') {
                    addDepartment(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }

        } else if (controllerType === 'fetch') {
            if (privileges.Default?.addNewDepartment == 'yes' || 
            privileges.Default?.updateExistingDepartment == 'yes' || 
            privileges.Default?.deactivateExistingDepartment == 'yes' ||
            privileges.Default?.deleteExistingDepartment == 'yes') {
                getDepartments(socket, database, body, callback)
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


async function addDepartment(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {macAddress, schemaName, name, color, description, sessionID } = body

    //check if name is empty
    if (!name) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const department = new DepartmentTable(undefined, database, schemaName)

    const checkDepartment = await department.get("name = ?", [name], 1, 0)

    if(checkDepartment.length > 0) {

        callback({
            status: "exists",
            message: "A department with the same name exists"
        })
        return
    }
        
    department.setValues({
        name: name,
        color: color,
        description: description
    })

    const departmentSaveResult = await department.save()

    if ( departmentSaveResult.type == 'success' ) {
        if (database && schemaName && sessionID && departmentSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, departmentSaveResult.primaryKey, 'department', "added a new department", `added department ${name}`, 'updateAction', 'defaultPrivilege', 'updateExistingDepartment')
        }
        callback({
            status: "success",
            message: "Department has been added successfully!"
        })
        socket.broadcast.emit(schemaName+'/department/insertUpdate', 'success')
        socket.emit(schemaName+'/department/insertUpdate', 'success')
    } else {
        callback({
            status: "error",
            message: "Failed to add department."
        })
    }
}


async function updateDepartment(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {macAddress, schemaName, name, color, description, sessionID, departmentHiddenID } = body
    //check if name is empty
    if (!name) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }
    const department = new DepartmentTable(undefined, database, schemaName)
    const checkDepartment = await department.get("name = ?", [name], 1, 0)
    if(checkDepartment.length > 0) {
        //updating service  
        department.setValues({
            id: departmentHiddenID,
            name: name,
            color: color,
            description: description
        })

        const departmentSaveResult = await department.update(["name", "description", "color"])

        if ( departmentSaveResult == "success" ) {
            if (database && schemaName && sessionID && departmentHiddenID) {
                Notifier(database, socket, schemaName, sessionID, userID, departmentHiddenID, 'department', "updated an existing department", `updated the department details for ${checkDepartment[0].name}`, "updateAction", 'defaultPrivilege', 'updateExistingDepartment')
            }
            callback({
                status: "success",
                message: "Department has been updated successfully!"
            })
            socket.broadcast.emit(schemaName+'/department/insertUpdate', 'success')
            socket.emit(schemaName+'/department/insertUpdate', 'success')
        } else {

            callback({
                status: "error",
                message: "Failed to update department!"
            })

        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid department!"
        })
    }
}


async function getDepartments(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {macAddress, schemaName, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found!"
        })
        return
    }

    const department = new DepartmentTable(undefined, database, schemaName)

    const allDepartment = await department.getAll(10, 0)

    if ( allDepartment.length > 0) {

        callback({
            status: "success",
            data: allDepartment
        })

    } else {

        callback({
            status: "empty",
            message: "Department list is empty!"
        })

    }

}


export default DepartmentController
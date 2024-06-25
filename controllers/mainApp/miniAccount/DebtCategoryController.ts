import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import DebtCategoryTable from "../../../models/mainApp/miniAccount/DebtCategoryTable"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    name?:string
    dependency?:number
    color?:string
    description?:string
    macAddress?:string
    schemaName?:string
    debtCategoryHiddenID?:number
    sessionID:string|number
}

const DebtCategoryController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
        console.log("add " + privileges.MiniAccount?.addNewDebtCategory)
        if (controllerType === 'insert/update') {
            if (body.debtCategoryHiddenID) {
                if (privileges.MiniAccount?.updateExistingDebtCategory == 'yes') {
                    updateDebtCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.MiniAccount?.addNewDebtCategory == 'yes') {
                    addDebtCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }
        } else if (controllerType === 'fetch') {
            console.log("add " + privileges.MiniAccount?.addNewDebtCategory+" " + userID)
            console.log("update " + privileges.MiniAccount?.updateExistingDebtCategory)
            console.log("deactivate " + privileges.MiniAccount?.deactivateDebtCategory)
            console.log("delete " + privileges.MiniAccount?.deleteDebtCategory)
            if (privileges.MiniAccount?.addNewDebtCategory == 'yes' || 
            privileges.MiniAccount?.updateExistingDebtCategory == 'yes' || 
            privileges.MiniAccount?.deactivateDebtCategory == 'yes' ||
            privileges.MiniAccount?.deleteDebtCategory == 'yes') {
                getDebtCategory(socket, database, body, callback)
            } else {
                callback({
                    status: 'warning',
                    message: 'You have no privilege to perform this task!'
                })
            }
        }
    } else {
        console.log("session")
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}


async function updateDebtCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, name, dependency, color, description, debtCategoryHiddenID, sessionID} = body
    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const debtCategory = new DebtCategoryTable(undefined, database, schemaName)
    //check debt
    const checkDebtCategory = await debtCategory.get('id = ?', [debtCategoryHiddenID], 1, 0)

    if (!checkDebtCategory.length) {
        callback({
            status: 'error',
            message: 'This record does not exist'
        })
        return
    }
    debtCategory.setValues({
        id: debtCategoryHiddenID,
        categoryName: name,
        dependency: dependency ? dependency : undefined,
        color: color ? color : '255,255,255',
        description: description,
    })

    const debtCategoryUpdateResult = await debtCategory.update(["name", "dependency", "color", "description"])

    if ( debtCategoryUpdateResult == "success" ) {
        if (database && schemaName && sessionID && debtCategoryHiddenID) {
            Notifier(database, socket, schemaName, sessionID, userID, debtCategoryHiddenID, 'debtCategory', "updated an existing debt category", "updated an existing record", 'updateAction', 'miniAccountPrivilege', 'updateExistingDebtCategory')
        }
        callback({
            status: "success",
            message: "Debt category updated successfully"
        })
        socket.broadcast.emit(schemaName+'/debtCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/debtCategory/insertUpdate', 'success')
    } else {

        callback({
            status: "failed",
            message: 'failed to update debt'
        })

    }

} 

async function addDebtCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, name, dependency, color, description, sessionID} = body
    console.log(body)
    //check if name is empty
    if (!name || !description) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const debtCategory = new DebtCategoryTable(undefined, database, schemaName)

    //check if category exist with same name
    const checkDebtName = await debtCategory.get("categoryName = ?", [name], 1, 0)

    if(checkDebtName.length > 0) {
        callback({
            status: "exists",
            message: "A category exists with the same name"
        })
        return
    }

    debtCategory.setValues({
        categoryName: name,
        dependency: dependency ? dependency : undefined,
        color: color ? color : '255,255,255',
        description: description,
        sessionID: sessionID
    })

    const debtCategorySaveResult = await debtCategory.save()

    if ( debtCategorySaveResult.type === "success" ) {
        if (database && schemaName && sessionID && debtCategorySaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, debtCategorySaveResult.primaryKey, 'debtCategory', "added a new debt category", "added a new record", 'newInsertAction', 'miniAccountPrivilege', 'addNewDebtCategory')
        }
        callback({
            status: "success",
            message: "Debt category added successfully"
        })
        socket.broadcast.emit(schemaName+'/debtCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/debtCategory/insertUpdate', 'success')
    } else {
        callback({
            status: "error",
            message: 'Failed to add debt category'
        })

    }

}

async function getDebtCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {schemaName} = body

    const debtCategory = new DebtCategoryTable(undefined, database, schemaName)
    const allDebtCategory = await debtCategory.getAll(10, 0)
    console.log(allDebtCategory)
    if ( allDebtCategory.length > 0) {
        callback({
            status: "success",
            data: allDebtCategory
        })
    } else {
        callback({
            status: "empty",
            message: "Debt category list empty"
        })
    }
}


export default DebtCategoryController
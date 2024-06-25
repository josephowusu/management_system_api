import MySQL from "mysql"
import { Socket } from "socket.io"
import ProductCategoryTable from "../../../models/mainApp/inventory/ProductCategoryTable"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import ExpenseCategoryTable from "../../../models/mainApp/miniAccount/ExpenseCategoryTable"
import CollectionCategoryTable from "../../../models/mainApp/miniAccount/CollectionCategoryTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    name?:string
    dependency?:number
    color?:string
    description?:string
    macAddress?:string
    schemaName?:string
    expenseCategoryHiddenID?:number
    sessionID:string|number
}

const CollectionCategoryController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.expenseCategoryHiddenID) {
                if (privileges.MiniAccount?.updateExistingCollectionCategory == 'yes') {
                    updateExpenseCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            } else {
                if (privileges.MiniAccount?.addNewCollectionCategory == 'yes') {
                    addCollectionCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            }

        } else if (controllerType === 'fetch') {
            if (privileges.MiniAccount?.addNewCollectionCategory == 'yes' || 
                privileges.MiniAccount?.updateExistingCollectionCategory == 'yes' || 
                privileges.MiniAccount?.deactivateCollectionCategory == 'yes' ||
                privileges.MiniAccount?.deleteCollectionCategory == 'yes') {
                    getCollectionCategory(socket, database, body, callback)
                }
        }
    
    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}


async function updateExpenseCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {macAddress, schemaName, name, dependency, color, description, expenseCategoryHiddenID, sessionID} = body

    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const expenseCategory = new ExpenseCategoryTable(undefined, database, schemaName)


    expenseCategory.setValues({
        id: expenseCategoryHiddenID,
        categoryName: name,
        dependency: dependency,
        color: color,
        description: description
    })

    const productCategoryUpdateResult = await expenseCategory.update(["name", "dependency", "color", "description"])

    if ( productCategoryUpdateResult == "success" ) {
        if (database && schemaName && sessionID && expenseCategoryHiddenID) {
            Notifier(database, socket, schemaName, sessionID, userID, expenseCategoryHiddenID, 'collectionCategory', "updated existing collection category", "updated an existing collection category record", 'updateAction', 'miniAccountPrivilege', 'updateExistingCollectionCategory')
        }
        callback({
            status: "success",
            message: "Collection category has been updated successfully!"
        })
        socket.broadcast.emit(schemaName+'/miniAccount/collectionCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/miniAccount/collectionCategory/insertUpdate', 'success')
    } else {

        callback({
            status: "error",
            message: "Failed to update collection category!"
        })

    }

}

async function addCollectionCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, name, dependency, color, description, sessionID} = body
    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const collectionCategory = new CollectionCategoryTable(undefined, database, schemaName)
    //check if category already exist with same name
    const checkCollection = await collectionCategory.get("name = ?", [name], 1, 0)

    if(checkCollection.length > 0) {
        callback({
            status: "exists",
            message: "A category exists with the same name"
        })
        return
    }

    collectionCategory.setValues({
        categoryName: name,
        dependency: dependency,
        color: color,
        description: description,
        sessionID: sessionID
    })

    const collectionCategorySaveResult = await collectionCategory.save()

    if ( collectionCategorySaveResult.type === "success" ) {
        if (database && schemaName && sessionID && collectionCategorySaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, collectionCategorySaveResult.primaryKey, 'collectionCategory', "added a new collection category", "added a new collection category to existing record", "newInsertAction", 'miniAccountPrivilege', 'addNewCollectionCategory')
        }
        callback({
            status: "success",
            message: "Collection category has been added successfully!"
        })
        socket.broadcast.emit(schemaName+'/miniAccount/collectionCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/miniAccount/collectionCategory/insertUpdate', 'success')
    } else {

        callback({
            status: "error",
            message: "Failed to add collection category"
        })

    }

}

async function getCollectionCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {schemaName} = body

    const collectionCategory = new CollectionCategoryTable(undefined, database, schemaName)
    const allCollectionCategory = await collectionCategory.getAll(10, 0)

    if ( allCollectionCategory.length > 0) {
        callback({
            status: "success",
            data: allCollectionCategory
        })
    } else {
        callback({
            status: "empty",
            message: "Collection category list is empty!"
        })
    }
}


export default CollectionCategoryController
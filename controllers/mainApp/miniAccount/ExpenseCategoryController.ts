import MySQL from "mysql"
import { Socket } from "socket.io"
import ProductCategoryTable from "../../../models/mainApp/inventory/ProductCategoryTable"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import ExpenseCategoryTable from "../../../models/mainApp/miniAccount/ExpenseCategoryTable"
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

const ExpenseCategoryController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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
                if (privileges.MiniAccount?.updateExistingExpenseCategory == 'yes') {
                    updateExpenseCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.MiniAccount?.addNewExpenseCategory == 'yes') {
                    addExpenseCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }

        } else if (controllerType === 'fetch') {
            if (privileges.MiniAccount?.addNewExpenseCategory == 'yes' || 
            privileges.MiniAccount?.updateExistingExpenseCategory == 'yes' || 
            privileges.MiniAccount?.deactivateExistingExpenseCategory == 'yes' ||
            privileges.MiniAccount?.deleteExistingExpenseCategory == 'yes') {
                getExpenseCategory(socket, database, body, callback)
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
            message: 'Session has expired!'
        })
    }
}


async function updateExpenseCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, name, dependency, color, description, sessionID, expenseCategoryHiddenID} = body

    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const expenseCategory = new ExpenseCategoryTable(undefined, database, schemaName)
    const checkExpense = await expenseCategory.get("id = ?", [expenseCategoryHiddenID], 1, 0)

    if( checkExpense.length > 0) {

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
                Notifier(database, socket, schemaName, sessionID, userID, expenseCategoryHiddenID, 'expenseCategory', "updated an existing expense category", "updated expense category"+ name, 'updateAction', 'miniAccountPrivilege', 'updateExistingExpenseCategory')
            }
            callback({
                status: "success",
                message: "Expense category has been updated successfully!"
            })
            socket.broadcast.emit(schemaName+'miniAccount/expenseCategory/insertUpdate', 'success')
            socket.emit(schemaName+'miniAccount/expenseCategory/insertUpdate', 'success')
        } else {
            callback({
                status: "error",
                message: "Failed to update expense category!"
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid expense category!"
        })
    }
} 


async function addExpenseCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, name, dependency, color, description, sessionID} = body
    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const expenseCategory = new ExpenseCategoryTable(undefined, database, schemaName)
    //check if category exist with same name
    const checkProductName = await expenseCategory.get("categoryName = ?", [name], 1, 0)

    if(checkProductName.length > 0) {
        callback({
            status: "exists",
            message: "A category exists with the same name"
        })
        return
    }

    expenseCategory.setValues({
        categoryName: name,
        dependency: dependency,
        color: color,
        description: description,
        sessionID: sessionID
    })

    const expenseCategorySaveResult = await expenseCategory.save()

    if ( expenseCategorySaveResult.type === "success" ) {
        if (database && schemaName && sessionID && expenseCategorySaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, expenseCategorySaveResult.primaryKey, 'expenseCategory', "added a new expense category", "added expense category "+name, 'newInsertAction', 'miniAccountPrivilege', 'addNewExpenseCategory')
        }
        callback({
            status: "success",
            message: "Expense category has been added successfully!"
        })
        socket.broadcast.emit(schemaName+'miniAccount/expenseCategory/insertUpdate', 'success')
        socket.emit(schemaName+'miniAccount/expenseCategory/insertUpdate', 'success')

    } else {
        callback({
            status: "error",
            message: 'Failed to add expense category'
        })

    }

}


async function getExpenseCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){
    const { schemaName } = body

    const expenseCategory = new ExpenseCategoryTable(undefined, database, schemaName)
    const allExpenseCategory = await expenseCategory.getAll(10, 0)

    if ( allExpenseCategory.length > 0) {

        callback({
            status: "success",
            data: allExpenseCategory
        })

    } else {

        callback({
            status: "empty",
            message: "Expense category list is empty!"
        })

    }

}


export default ExpenseCategoryController
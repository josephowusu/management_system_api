import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import ExpenseTable from "../../../models/mainApp/miniAccount/ExpenseTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"

interface socketBody {
    expenseCategoryID?:string
    amount?:number
    expenseDate?:string
    receiver?:string
    description?:string
    currency?:string
    exchangeRate?:number
    macAddress?:string
    schemaName?:string
    expenseHiddenID?:number
    sessionID?:string|number
}


const ExpenseController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
    
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
            if (body.expenseHiddenID) {
                if (privileges.MiniAccount?.updateExistingExpense == 'yes') {
                    updateExpense(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.MiniAccount?.addNewExpense == 'yes') {
                    addExpense(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }

        } else if (controllerType === 'fetch') {
            
            if (privileges.MiniAccount?.addNewExpense == 'yes' || 
            privileges.MiniAccount?.updateExistingExpense == 'yes' || 
            privileges.MiniAccount?.deactivateExistingExpense == 'yes' ||
            privileges.MiniAccount?.deleteExistingExpense == 'yes') {
                getExpense(socket, database, body, callback)
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

async function updateExpense(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {expenseCategoryID, amount, expenseDate, receiver, currency, exchangeRate, description, macAddress, schemaName, expenseHiddenID, sessionID} = body

    if (!expenseCategoryID || !amount || !expenseDate || !receiver || !description || !expenseHiddenID) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const expense = new ExpenseTable(undefined, database, schemaName)
    const checkExpenseID = await expense.get("id = ?", [expenseHiddenID], 1, 0)

    if(checkExpenseID.length < 1) {
        callback({
            status: "error",
            message: "No record found!"
        })
        return
    }

    expense.setValues({
        id: expenseHiddenID,
        expenseCategoryID: expenseCategoryID,
        amount: amount,
        currency: currency,
        exchangeRate: exchangeRate,
        expenseDate: expenseDate,
        receiver: receiver,
        description: description,
        sessionID: sessionID,
    })

    const expenseUpdateResult = await expense.update(["amount", "receiver", "description", "expenseCategoryID", "expenseDate"])

    if ( expenseUpdateResult === "success") {
        if (database && schemaName && sessionID && expenseHiddenID) {
            Notifier(database, socket, schemaName, sessionID, userID, expenseHiddenID, 'expense', "updated an existing expense", "updated an expense record", 'updateAction', 'miniAccountPrivilege', 'updateExistingExpense')
        }
        callback({
            status: "success",
            message: "Expense has been updated successfully!"
        })
        socket.broadcast.emit(schemaName+'miniAccount/expense/insertUpdate', 'success')
        socket.emit(schemaName+'miniAccount/expense/insertUpdate', 'success')
    } else {
        callback({
            status: "error",
            message: "Failed to update expense!"
        })
    }
}


async function addExpense(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {expenseCategoryID, amount, expenseDate, currency, exchangeRate, receiver,  description, macAddress, schemaName, sessionID} = body

    if (!expenseCategoryID || !amount || !expenseDate || !receiver || !description || !currency) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const expense = new ExpenseTable(undefined, database, schemaName)

    expense.setValues({
        expenseCategoryID: expenseCategoryID,
        amount: amount,
        expenseDate: expenseDate,
        receiver: receiver,
        description: description,
        currency: currency,
        exchangeRate: exchangeRate,
        sessionID: sessionID,
    })

    const expenseSaveResult = await expense.save()

    if ( expenseSaveResult.type === "success") {
        if (database && schemaName && sessionID && expenseSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, expenseSaveResult.primaryKey, 'expense', "added a new expense", "added a new expense record", 'newInsertAction', 'miniAccountPrivilege', 'addNewExpense')
        }
        callback({
            status: "success",
            message: "Expense has been added successfully!"
        })
        socket.broadcast.emit(schemaName+'miniAccount/expense/insertUpdate', 'success')
        socket.emit(schemaName+'miniAccount/expense/insertUpdate', 'success')
    } else {

        callback({
            status: "error",
            message: "Failed to add expense!"
        })

    }
}


async function getExpense(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const { schemaName } = body

    const expense = new ExpenseTable(undefined, database, schemaName)
    const allExpense = await expense.getAll(10, 0)

    if ( allExpense.length > 0) {
        callback({
            status: "success",
            data: allExpense
        })
    } else {
        callback({
            status: "empty",
            message: "Expense list is empty!"
        })
    }
}


export default ExpenseController
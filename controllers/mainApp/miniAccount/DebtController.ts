import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import DebtTable from "../../../models/mainApp/miniAccount/DebtTable"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    supplierID?:string|number
    debtCategoryID:string|number
    invoiceNumber?:string
    amount?:number
    currency?:string
    exchangeRate?:number
    dateOfTransaction?:string
    dueDate?:string
    transactionDescription?:string
    macAddress?:string
    schemaName?:string
    deptHiddenID?:number
    sessionID:string|number
}

const DebtController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
    if ( !body.macAddress || !body.schemaName) {
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
            if (body.deptHiddenID) {
                if (privileges.MiniAccount?.updateExistingDebt == 'yes') {
                    updateDebt(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.MiniAccount?.addNewDebt == 'yes') {
                    addDebt(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.MiniAccount?.addNewDebt == 'yes' || 
            privileges.MiniAccount?.updateExistingDebt == 'yes' || 
            privileges.MiniAccount?.deactivateDebt == 'yes' ||
            privileges.MiniAccount?.deleteDebt == 'yes') {
                getDebt(socket, database, body, callback)
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


async function updateDebt(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, supplierID, deptHiddenID, debtCategoryID, currency, exchangeRate, invoiceNumber, amount, dateOfTransaction, dueDate, transactionDescription, sessionID} = body

    if (!supplierID || !amount || !dueDate || !currency) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const Debt = new DebtTable(undefined, database, schemaName)
    //check debt
    const checkDebt = await Debt.get('debt.id = ?', [deptHiddenID], 1, 0)

    if (!checkDebt.length) {
        callback({
            status: 'error',
            message: 'This record does not exist'
        })
        return
    }

    Debt.setValues({
        id: checkDebt[0].id,
        supplierID: supplierID,
        debtCategoryID: debtCategoryID,
        invoiceNumber: invoiceNumber,
        amount: amount,
        currency: currency,
        exchangeRate: exchangeRate,
        dateOfTransaction: dateOfTransaction,
        dueDate:dueDate,
        transactionDescription: transactionDescription
    })

    const updateDebtResult = await Debt.update(['supplierID', 'debtCategoryID', 'invoiceNumber', 'amount', 'currency', 'dateOfTransaction', 'dueDate', 'transactionDescription'])

    if (updateDebtResult === 'success') {
        if (database && schemaName && sessionID && deptHiddenID) {
            Notifier(database, socket, schemaName, sessionID, userID, deptHiddenID, 'debt', "updated an existing debt", "updated an existing new record", 'updateAction', 'miniAccountPrivilege', 'updateExistingDebt')
        }
        callback({
            status: "success",
            message: "Debt updated successfully"
        })
        socket.broadcast.emit(schemaName+'/debt/insertUpdate', 'success')
        socket.emit(schemaName+'/debt/insertUpdate', 'success')
    } else {
        callback({
            status: "failed",
            message: 'failed to update debt'
        })
    }
}


async function addDebt(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, supplierID, debtCategoryID, invoiceNumber, amount, currency, exchangeRate, dateOfTransaction, dueDate, transactionDescription, sessionID} = body
    console.log(body)
    if (!supplierID || !amount || !dueDate || !currency) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const Debt = new DebtTable(undefined, database, schemaName)
    //check debt
    const checkDebt = await Debt.get('supplierID = ? AND invoiceNumber = ?', [supplierID, invoiceNumber], 1, 0)
    if (checkDebt.length > 0) {
        callback({
            status: "exists",
            message: "A debt with the same details exists"
        })
        return
    }
    //insert into debt
    Debt.setValues({
        supplierID: supplierID,
        debtCategoryID: debtCategoryID,
        invoiceNumber: invoiceNumber,
        amount: amount,
        currency: currency,
        exchangeRate: exchangeRate ? exchangeRate : 1,
        dateOfTransaction: dateOfTransaction,
        dueDate:dueDate,
        transactionDescription: transactionDescription,
        sessionID: sessionID
    })

    const saveDebtResult = await Debt.save()

    if (saveDebtResult.type === "success") {
        if (database && schemaName && sessionID && saveDebtResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, saveDebtResult.primaryKey, 'debt', "added a new debt", "added a new record", 'newInsertAction', 'miniAccountPrivilege', 'addNewDebt')
        }
        callback({
            status: 'success',
            message: 'Debt added successfully'
        })
        socket.broadcast.emit(schemaName+'/debt/insertUpdate', 'success')
        socket.emit(schemaName+'/debt/insertUpdate', 'success')
    } else {
        callback({
            status: 'failed',
            message: 'Failed to add debt'
        })
    }
}


async function getDebt(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {schemaName} = body

    const Debt = new DebtTable(undefined, database, schemaName)
    const allDebt = await Debt.getAll(10, 0)

    if ( allDebt.length > 0) {
        callback({
            status: "success",
            data: allDebt
        })
        console.log(allDebt)
    } else {
        callback({
            status: "empty",
            message: "Debt list empty"
        })
    }
}

export default DebtController
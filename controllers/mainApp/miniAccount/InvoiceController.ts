import MySQL from "mysql"
import { Socket } from "socket.io"

import { authenticateSession, fullDateTime, generateID } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import InvoiceTable from "../../../models/mainApp/miniAccount/InvoiceTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import UserTable from "../../../models/mainApp/default/UserTable"
import BusinessTable from "../../../models/mainApp/default/BusinessTable"


interface socketBody {
    invoiceType?:string
    invoiceDate?:string
    clientID?:number
    reference?:string
    itemList?:string
    invoiceAmount?:number
    balance?:number
    currency?:string
    exchangeRate?:number
    tax?:boolean
    companyBankID?:string|number
    preparedBy?:string
    macAddress:string
    schemaName:string
    invoiceHiddenID?:number
    sessionID:string|number
}

const InvoiceController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody , callback:iSocketCallback) => {
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

            if (body.invoiceHiddenID) {
                if (privileges.MiniAccount?.updateExistingInvoice == 'yes') {
                    updateStock(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.MiniAccount?.addNewInvoice == 'yes') {
                    addInvoice(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }

        } else if (controllerType === 'fetch') {
            if (privileges.MiniAccount?.addNewInvoice == 'yes' || 
            privileges.MiniAccount?.updateExistingInvoice == 'yes' || 
            privileges.MiniAccount?.deactivateExistingInvoice == 'yes' ||
            privileges.MiniAccount?.deleteExistingInvoice == 'yes') {
                getInvoice(socket, database, body, callback)
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

async function updateStock(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {invoiceType, invoiceDate, clientID, reference, currency, exchangeRate, itemList, invoiceAmount, tax, schemaName, invoiceHiddenID} = body

    if (!invoiceType || !invoiceDate || !itemList) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const invoiceTable = new InvoiceTable(undefined, database, schemaName)
    const checker = await invoiceTable.get("invoice.id = ?", [invoiceHiddenID], 1, 0)
    
    if (checker.length > 0) {

        invoiceTable.setValues({
            id: invoiceHiddenID,
            invoiceType: invoiceType,
            invoiceDate: invoiceDate,
            clientID: clientID,
            reference: reference,
            itemList: itemList,
            currency: currency,
            exchangeRate: exchangeRate,
            invoiceAmount: invoiceAmount,
            tax: tax
        })
    
        const stockSaveResult = await invoiceTable.update(["supplierID", "invoiceDate", "InvoiceNumber", "totalAmount", "itemList"])
    
        if ( stockSaveResult == "success") {
            callback({
                status: "success",
                message: "Product added successfully"
            })
        } else {
            callback({
                status: "error",
                message: stockSaveResult
            })
        }
    }else {
        console.log({
            status: "error",
            message: "Cannot update invalid Invoice"
        })
    }
}

async function addInvoice(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {clientID, invoiceType, reference, itemList, invoiceDate, balance, companyBankID, tax, invoiceAmount, currency, exchangeRate, macAddress, schemaName, sessionID} = body
    
    if (!invoiceType) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }
  
    const invoiceTable = new InvoiceTable(undefined, database, schemaName)
    const user = new UserTable(undefined, database, schemaName)
    const userDetails = await user.get("user.id = ?", [userID], 1, 0)
    const employeeName = Array.isArray(userDetails) && userDetails.length > 0 ? (userDetails[0].firstName + ' ' + (userDetails[0].otherName == null ? '' : userDetails[0].otherName) + ' ' + userDetails[0].lastName) : ''
    
    invoiceTable.setValues({
        invoiceType: invoiceType,
        invoiceDate: invoiceDate,
        clientID: clientID ? Number(clientID) : null,
        reference: reference,
        itemList: itemList,
        invoiceAmount: invoiceAmount,
        invoiceBalance: balance ? balance : undefined,
        currency: currency,
        companyBankID: companyBankID ? Number(companyBankID) : null,
        exchangeRate: exchangeRate,
        tax: tax,
        preparedBy: employeeName ? employeeName : userID,
        sessionID: sessionID ? sessionID : null
    })

    const invoiceSaveResult = await invoiceTable.save()
    console.log(invoiceSaveResult)
    if ( invoiceSaveResult.type == 'success' ) {
        if (database && schemaName && sessionID && invoiceSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, invoiceSaveResult.primaryKey, 'invoice', "added a new invoice", "added invoice INV-"+ invoiceSaveResult.primaryKey, 'newInsertAction', 'miniAccountPrivilege', 'addNewInvoice')
        }
        callback({
            status: 'success',
            message: 'Invoice has been added successfully!',
            data: invoiceSaveResult.type == 'success' ? invoiceSaveResult.primaryKey : null
        })
        socket.broadcast.emit(schemaName+'/invoice/insertUpdate', 'success')
        socket.emit(schemaName+'/invoice/insertUpdate', 'success')

    } else {
        callback({
            status: "error",
            message: 'Failed to add invoice!'
        })
    }
}

async function getInvoice(socket:Socket, database:MySQL.Connection|null, body:any, callback:any) {
    const {schemaName, sessionID} = body

    const invoice = new InvoiceTable(undefined, database, schemaName)
    const allInvoice = await invoice.getAll(10, 0)
    const business = new BusinessTable(undefined, database, schemaName)
    const uniqueCode = schemaName ? schemaName.split("_")[1] : null
    const checkCompany = await business.get("uniqueCode = ?", [uniqueCode], 1, 0)
    if (checkCompany.length){
        console.log(checkCompany)
        allInvoice[0]['companyDetail'] = { 
            companyName: checkCompany[0].name,
            companyPhone: checkCompany[0].phone,
            companyEmail: checkCompany[0].email,
            companyAddress: checkCompany[0].postalAddress
        }
    }
    if ( allInvoice.length > 0) {
        callback({
            status: "success",
            data: allInvoice
        })
    } else {
        callback({
            status: "empty",
            message: "Invoice list is empty!"
        })
    }
}

export default InvoiceController
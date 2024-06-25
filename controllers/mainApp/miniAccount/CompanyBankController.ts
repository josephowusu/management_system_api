import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import CompanyBankTable from "../../../models/mainApp/miniAccount/CompanyBankTable"
import BankTable from "../../../models/mainApp/default/BankTable"
import { fetchPrivileges } from "../default/AuthenticateController"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    bankOrNetworkName?:string
    accountNumber?:number
    accountName?:string
    type?:string
    macAddress?:string
    schemaName?:string
    companyBankHiddenID?:number
    sessionID?:number|string
}

const CompanyBankController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {

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

            if (body.companyBankHiddenID) {
    
                if (privileges.MiniAccount?.updateExistingCompanyBank == 'yes') {
                    updateCompanyBank(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
        
            } else {
        
                if (privileges.MiniAccount?.addNewCompanyBank == 'yes') {
                    addCompanyBank(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }
    
        } else if (controllerType === 'fetch') {
            if (privileges.MiniAccount?.addNewCompanyBank == 'yes' || 
                privileges.MiniAccount?.updateExistingCompanyBank == 'yes' || 
                privileges.MiniAccount?.deactivateExistingCompanyBank == 'yes' ||
                privileges.MiniAccount?.deleteExistingCompanyBank == 'yes') {
                getCompanyBank(socket, database, body, callback)
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


async function addCompanyBank(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {schemaName, bankOrNetworkName, accountNumber, accountName, type, sessionID } = body

    const bankTable = new BankTable(undefined, database, schemaName)
    const companyBank = new CompanyBankTable(undefined, database, schemaName)
    
    //check if name is empty
    if (!bankOrNetworkName || !accountNumber  || !accountName || !type) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const checkBank = await bankTable.get("name = ?", [bankOrNetworkName], 1, 0)
    const checkBankAccount = await companyBank.get("accountNumber = ? AND accountName = ?", [accountNumber, accountName], 1, 0)

    if (checkBankAccount.length > 0) {
        callback({
            status: "exists",
            message: "A company bank exists with the same details!"
        })
        return
    } else {
        let companyBankSaveResult
        if (checkBank.length < 1) {

            bankTable.setValues({
                name: bankOrNetworkName,
                sessionID: sessionID
            })

            const bankSaveResult = await bankTable.save()

            companyBank.setValues({
                bankID: bankSaveResult.type === "success" ? bankSaveResult.primaryKey : null,
                accountNumber: accountNumber,
                accountName: accountName,
                balance: 0,
                sessionID: sessionID
            })
    
            companyBankSaveResult = await companyBank.save()

        } else {

            companyBank.setValues({
                bankID: checkBank[0].id ? checkBank[0].id : null,
                accountNumber: accountNumber,
                accountName: accountName,
                type: type,
                balance: 0,
                sessionID: sessionID
            })
    
            companyBankSaveResult = await companyBank.save()
        }

        if ( companyBankSaveResult.type === "success" ) { 
            if (database && schemaName && sessionID && companyBankSaveResult.primaryKey) {
                Notifier(database, socket, schemaName, sessionID, userID, companyBankSaveResult.primaryKey, 'companyBank', "added a new company bank", "added a new record to company bank", 'newInsertAction', 'miniAccountPrivilege', 'addNewCompanyBank')
            }
            callback({
                status: 'success',
                message: 'Company Bank has been added successfully!',
            })
            socket.broadcast.emit(schemaName+'/companyBank/insertUpdate', 'success')
            socket.emit(schemaName+'/companyBank/insertUpdate', 'success')
        } else {
            callback({
                status: 'error',
                message: 'Failed to add company bank!',
            })
        }
    }
}


async function updateCompanyBank(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {bankOrNetworkName, accountNumber, accountName, type, sessionID, companyBankHiddenID, schemaName } = body

    const bankTable = new BankTable(undefined, database, schemaName)
    const companyBank = new CompanyBankTable(undefined, database, schemaName)

    //check if name is empty
    if (!bankOrNetworkName || !accountNumber || !accountName || !type) {
        callback({
            status: "error",
            message: "Some fields are required!"
        })
        return
    }

    const checkBank = await bankTable.get("name = ?", [bankOrNetworkName], 1, 0)
    const checkBankAccount = await companyBank.get("companyBank.id = ?", [companyBankHiddenID], 1, 0)
    if (checkBankAccount.length > 0) {
        let bankSaveResult
        if (checkBank.length < 1) {
            bankTable.setValues({
                name: bankOrNetworkName,
                sessionID: sessionID
            })
            bankSaveResult = await bankTable.save()
        }
        const bankID = bankSaveResult && bankSaveResult.primaryKey ? bankSaveResult.primaryKey : checkBank[0].id
        companyBank.setValues({
            id: companyBankHiddenID,
            bankID: bankID,
            accountNumber: accountNumber,
            accountName: accountName,
            type: type,
            balance: 0,
        })
        const updateCompanyBank = await companyBank.update(["bankID","accountNumber","accountName"])
        if (updateCompanyBank === "success") {
            if (database && schemaName && sessionID && bankID) {
                Notifier(database, socket, schemaName, sessionID, userID, bankID, 'companyBank', "updated an existing company bank", "updated a existing record", 'updateAction', 'miniAccountPrivilege', 'addNewCompanyBank')
            }
            callback({
                status: 'success',
                message: 'Company Bank has been updated successfully!',
            })
            socket.broadcast.emit(schemaName+'/companyBank/insertUpdate', 'success')
            socket.emit(schemaName+'/companyBank/insertUpdate', 'success')
        } else {
            callback({
                status: 'error',
                message: 'Failed to add company bank!',
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid company bank"
        })
    }
}


async function getCompanyBank(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const { schemaName } = body
    const companyBank = new CompanyBankTable(undefined, database, schemaName)
    const allCompanyBank = await companyBank.getAll(10, 0)

    if ( allCompanyBank.length > 0) {
        
        callback({
            status: "success",
            data: allCompanyBank
        })

    } else {

        callback({
            status: "empty",
            message: "Company bank is list empty!"
        })

    }

}


export default CompanyBankController
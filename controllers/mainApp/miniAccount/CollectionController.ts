import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import CollectionTable from "../../../models/mainApp/miniAccount/CollectionTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import UserTable from "../../../models/mainApp/default/UserTable"


interface socketBody {
    collectionCategoryID:number
    clientID?:number
    serviceID?:number
    description?:string
    charge?:number
    currency?:string
    exchangeRate?:number
    amountPaid?:number
    balance?:number
    paymentMethod?:string
    companyBankID?:number
    chequeNumber?:string
    dateOnCheque?:string
    mobileMoneyName?:string
    mobileMoneyNumber?:string
    paymentDate?:string
    paidBy?:string
    macAddress?:string
    schemaName?:string
    hiddenCollectionID?:number
    sessionID:string|number
}

const CollectionController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.hiddenCollectionID) {
                if (privileges.MiniAccount?.updateExistingCollection == 'yes') {
                    updateCollection(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            } else {
                if (privileges.MiniAccount?.addNewCollection == 'yes') {
                    addCollection(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }

        } else if (controllerType === 'fetch') {
            if (privileges.MiniAccount?.addNewCollection == 'yes' || 
            privileges.MiniAccount?.updateExistingCollection == 'yes' || 
            privileges.MiniAccount?.deactivateExistingCollection == 'yes' ||
            privileges.MiniAccount?.deleteExistingCollection == 'yes') {
                getCollection(socket, database, body, callback)
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


async function updateCollection(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {hiddenCollectionID, collectionCategoryID, clientID, serviceID, exchangeRate, description, mobileMoneyName, mobileMoneyNumber, charge, currency, amountPaid, balance, paymentMethod, companyBankID, chequeNumber, dateOnCheque, paymentDate, paidBy, macAddress, schemaName, sessionID} = body
        
    //check if name is empty
    if (!hiddenCollectionID || !clientID || !serviceID) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const collectionCategory = new CollectionTable(undefined, database, schemaName)
    const checkCollection = await collectionCategory.get("collection.id = ?", [hiddenCollectionID], 1, 0)
    if (checkCollection.length > 0) {

        collectionCategory.setValues({
            id: checkCollection[0].id,
            collectionCategoryID: collectionCategoryID,
            clientID: clientID,
            serviceID: serviceID,
            description: description,
            charge: charge,
            currency: currency,
            exchangeRate: exchangeRate,
            amountPaid: amountPaid,
            balance: balance,
            paymentMethod: paymentMethod,
            companyBankID: companyBankID ? companyBankID : null,
            chequeNumber: chequeNumber ? chequeNumber : undefined,
            dateOnCheque: dateOnCheque ? dateOnCheque : undefined,
            mobileMoneyName: mobileMoneyName ? mobileMoneyName : undefined,
            mobileMoneyNumber: mobileMoneyNumber ? mobileMoneyNumber : undefined,
            paymentDate: paymentDate,
            paidBy: paidBy,
            receivedBy: "Nana Alpheaus",
            sessionID: sessionID
        })

        const collectionUpdateResult = await collectionCategory.update(['collectionCategoryID','clientID','serviceID','description','charge','currency','amountPaid','balance','paymentMethod','companyBankID','chequeNumber','dateOnCheque','mobileMoneyName','mobileMoneyNumber','paymentDate','paidBy','receivedBy','status'])

        if ( collectionUpdateResult == "success" ) {
            if (database && schemaName && sessionID && checkCollection[0].id) {
                Notifier(database, socket, schemaName, sessionID, userID, checkCollection[0].id, 'collection', "updated existing collection", "updated an existing collection record", 'updateAction', 'miniAccountPrivilege', 'updateExistingCollection')
            }
            callback({
                status: "success",
                message: "Category has been updated successfully!"
            })
            socket.broadcast.emit(schemaName+'/miniAccount/collection/insertUpdate', 'success')
            socket.emit(schemaName+'/miniAccount/collection/insertUpdate', 'success')
        } else {
            callback({
                status: "error",
                message: "Failed to add to collection!"
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid collection!"
        })
    }
}

async function addCollection(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {collectionCategoryID, clientID, serviceID, description, mobileMoneyName, exchangeRate, mobileMoneyNumber, charge, currency, amountPaid, balance, paymentMethod, companyBankID, chequeNumber, dateOnCheque, paymentDate, paidBy, macAddress, schemaName, sessionID} = body
    //check if name is empty
    if (!collectionCategoryID || !clientID || !serviceID) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const collection = new CollectionTable(undefined, database, schemaName)
    const userTable = new UserTable(undefined, database, schemaName)
    const userDetails = await userTable.get("user.id = ?", [userID], 1, 0)
    const employeeName = Array.isArray(userDetails) && userDetails.length > 0 ? (userDetails[0].firstName + ' ' + (userDetails[0].otherName == null ? '' : userDetails[0].otherName) + ' ' + userDetails[0].lastName) : '';
    collection.setValues({
        collectionCategoryID: collectionCategoryID,
        clientID: clientID,
        serviceID: serviceID,
        description: description,
        charge: charge,
        currency: currency,
        exchangeRate: exchangeRate,
        amountPaid: amountPaid,
        balance: balance,
        paymentMethod: paymentMethod,
        companyBankID: companyBankID ? companyBankID : null,
        chequeNumber: chequeNumber ? chequeNumber : undefined,
        dateOnCheque: dateOnCheque ? dateOnCheque : undefined,
        mobileMoneyName: mobileMoneyName ? mobileMoneyName : undefined,
        mobileMoneyNumber: mobileMoneyNumber ? mobileMoneyNumber : undefined,
        paymentDate: paymentDate,
        paidBy: paidBy,
        receivedBy: employeeName ? employeeName : userID,
        sessionID: sessionID
    })

    const collectionSaveResult = await collection.save()
    
    if ( collectionSaveResult.type === "success" ) {
        if (database && schemaName && sessionID && collectionSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, collectionSaveResult.primaryKey, 'collection', "added a new collection", "recorded a collection of "+ amountPaid, 'newInsertAction', 'miniAccountPrivilege', 'addNewCollection')
        }
        callback({
            status: "success",
            message: "Collection has been added successfully!"
        })
        socket.broadcast.emit(schemaName+'/miniAccount/collection/insertUpdate', 'success')
        socket.emit(schemaName+'/miniAccount/collection/insertUpdate', 'success')
    } else {
        callback({
            status: "error",
            message: "Failed to add collection!"
        })
    }
}

async function getCollection(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {schemaName} = body

    const collection = new CollectionTable(undefined, database, schemaName)
    const allCollection = await collection.getAll(10, 0)
    if ( allCollection.length > 0) {
        callback({
            status: "success",
            data: allCollection
        })
    } else {
        callback({
            status: "empty",
            message: "Collection list is empty!"
        })
    }
}


export default CollectionController
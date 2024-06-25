import MySQL from "mysql"
const https = require('https')
import dotenv from 'dotenv'
import { Socket } from "socket.io"
import path from 'path'
import axios from 'axios'
dotenv.config({ path: path.join(__dirname, `../../.env`)})
import { authenticateSession, fullDate, fullDateTime, verifyPayment } from "../../../modules/GeneralModules"
import { iAuthenticateSessionResponseData, iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import SoftwarePackageTable from "../../../models/core/SoftwarePackageTable"
import SoftwarePurchaseTable from "../../../models/core/SoftwarePurchaseTable"
import { iModelList, iSystemModelListValues } from "../../../modules/interfaces/iMigration"
import AllSystemModelLists from "../../../models/list/AllModelLists"
import BusinessDatabaseTable from "../../../models/core/BusinessDatabaseTable"
import DatabaseMigration from "../../../models/general/DatabaseMigration"


interface myPackagesBody {
    macAddress:string
    schemaName:string
    sessionID:string|number
}

interface filterBody {
    search?:string
    offset?:number
    limit?:number
    macAddress:string
    schemaName:string
    sessionID:string|number
}

interface purchaseBody {
    packageIds:string[]
    paymentMethod:string|null
    accountNumber:string|null
    accountName:string|null
    packagePrice:number
    numberOfMonths:number
    paidAmount:number
    paymentDate:string
    referenceNumber:string
    email?:string|null
    phone?:string|null
    transactionId:string
    endOfSubscriptionDate:string
    macAddress:string
    schemaName:string
    sessionID:string|number
}

interface socketBody {
    purchase:purchaseBody
    filter:filterBody
    myPackages:myPackagesBody
}

const AppPackagesController = async (controllerType:'purchase'|'filter'|'myPackages', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
    
    if (!body[controllerType].macAddress || !body[controllerType].schemaName){
        callback({status: "Error", message: "Missing important parameter. Contact system administrator for support!"})
        return
    }
    
    const isSession = await authenticateSession(socket, database, body[controllerType].macAddress, body[controllerType].schemaName, body[controllerType].sessionID)

    if (isSession.type === 'success') {
        if (controllerType === 'purchase') {
            const result = await purchasePackage(database, body.purchase, isSession.data, socket)
            callback(result)
        } else if (controllerType === 'filter') {
            const result = await fetchPackages(database, body.filter)
            callback(result)
        } else if (controllerType === 'myPackages') {
            const result = await myPackages(database, body.myPackages, isSession.data)
            callback(result)
        }
    } else {
        callback({status: "error", message: "Your session has expired!"})
        return
    }

}

const fetchPackages = async (database:MySQL.Connection|null, body:filterBody) => {
    const softwarePackages = new SoftwarePackageTable(undefined, database, process.env.CORE_DB_NAME)
    let sqlWhere = body.search ? `CONCAT_WS(' ', name, description, price) LIKE ? AND status = ?` : `status = ?`
    let values = body.search ? ['%'+body.search+'%', 'active'] : ['active']
    body.limit = body.limit ? body.limit : 10
    body.offset = body.offset ? body.offset : 0
    const result = await softwarePackages.get(sqlWhere, values, body.limit, body.offset)
    return result
}

const myPackages = async (database:MySQL.Connection|null, body:myPackagesBody, sessionData?:iAuthenticateSessionResponseData) => {
    const purchasedApps = new SoftwarePurchaseTable(undefined, database, process.env.CORE_DB_NAME)
    let businessCode = sessionData && sessionData.businessCode ? sessionData.businessCode : 0
    const result = await purchasedApps.get(`businessCode = ? AND endOfSubscriptionDate >= ?`, [businessCode, fullDate()], 100, 0)
    return result
}

const getPurchasedFeatures = async (uniqueCode:any, businessID:any, date:any, softwarePurchase:SoftwarePurchaseTable) => {
    let featuresResult:any[] = []
    let tablesResult:any[] = []

    let purchaseResult = await softwarePurchase.get(`businessID = ? AND businessCode = ? AND endOfSubscriptionDate >= ?`, 
    [businessID, uniqueCode, date], 0, 0)
    for (let j = 0; j < purchaseResult.length; j++) {
        const item = purchaseResult[j]
        let features:string[] = item.features ? JSON.parse(item.features) : []
        let tables:string[] = item.featureTables ? JSON.parse(item.featureTables) : []

        featuresResult = [...featuresResult, ...features]
        tablesResult = [...tablesResult, ...tables]
    }

    return {featuresResult, tablesResult}
}


const purchasePackage = async (database:MySQL.Connection|null, body:purchaseBody,  sessionData?:iAuthenticateSessionResponseData, socket?:Socket) => {
    if (body.transactionId && body.referenceNumber && body.packageIds && body.paidAmount && body.packagePrice && body.paymentDate) {
        if (Array.isArray(body.packageIds) && body.packageIds.length) {
            for (let i = 0; i < body.packageIds.length; i++) {
                const secret_key = 'sk_test_35f933a179440d9095dfb467a111862fe9184323'
                const url = `https://api.paystack.co/transaction/verify/${body.referenceNumber}`
                axios({
                    method: 'get',
                    url: url,
                    headers: {
                      Authorization: `Bearer ${secret_key}`,
                      'Content-Type': 'application/json'
                    }
                }).then( async (response:any) => {
                    if (response.data.status === true) {
                        if (response.data.data.amount >= body.paidAmount) {
                            const expiry = fullDateTime()
                            const expiryDate = new Date(expiry)
                            expiryDate.setMonth(expiryDate.getMonth() + 1)
                            const businessDatabasesModel = new BusinessDatabaseTable(undefined, database, process.env.CORE_DB_NAME)
                            const purchaseTable = new SoftwarePurchaseTable(undefined, database, process.env.CORE_DB_NAME)
                            purchaseTable.setValues({
                                softwarePackageID: body.packageIds[i],
                                businessID: sessionData ? sessionData.businessID : undefined,
                                businessCode: sessionData ? sessionData.businessCode : undefined,
                                paymentMethod: body.paymentMethod ? body.paymentMethod : undefined,
                                accountNumber: body.accountNumber ? body.accountNumber : undefined,
                                accountName: body.accountName ? body.accountName : undefined,
                                packagePrice: body.packagePrice,
                                numberOfMonths: body.numberOfMonths,
                                paidAmount: response.data.data.amount / 100,
                                paymentDate: response.data.data.paid_at,
                                referenceNumber: body.referenceNumber,
                                email: body.email ? body.email : undefined,
                                phone: body.phone ? body.phone : 'null',
                                transactionId: body.transactionId,
                                endOfSubscriptionDate: expiryDate.toString(),
                                status: 'active',
                            })
                            let result = await purchaseTable.save()
                            // migration
                            const modelLists:iModelList[] = []

                            let migration = await getPurchasedFeatures(sessionData ? sessionData.businessCode : null, sessionData ? sessionData.businessID : null, expiryDate, purchaseTable)
                            
                            if (Array.isArray(migration.featuresResult) && migration.featuresResult.length) {
                                for (let f = 0; f < migration.featuresResult.length; f++) {
                                    let appName:iSystemModelListValues = migration.featuresResult[f]
                                    // console.log('appName: ', appName)
                                    if (AllSystemModelLists[appName]) {
                                        for (let p = 0; p < AllSystemModelLists[appName].length; p++) {
                                            const model = AllSystemModelLists[appName][p]
                                            // console.log('model.tableName: ', model.tableName)
                                            modelLists.push(model)
                                        }
                                    }
                                }
                            }
                            
                            const CoreDatabaseMigration = new DatabaseMigration(database, body.schemaName, modelLists, migration.tablesResult)
                            let createResult = await CoreDatabaseMigration.createDatabase(body.schemaName)
                            console.log(`Creation of ${body.schemaName} tables result: `, createResult, '\n\n')
                            socket ? socket.emit("/buy-package/"+body.referenceNumber, {
                                status: 'success',
                                message: '',
                                data: result.primaryKey
                            }, (res:any)=>{
                                console.log(res)
                            }) : null
                            return {status: 'success', message: '', data: result.primaryKey}
                            
                        } else {    
                            return {status: 'error', message: 'Amount received is less than amount expected'}
                        }
                    } else {
                        return {status: 'error', message: 'Payment not confirmed'}
                    }
                }).catch(error => {
                    return {status: 'error', message: error.message}
                })
            }
        } else {
            return {status: "warning", message: "You must select the packages you want to buy!"}
        }
    } else {
        return {status: "warning", message: "Some fields are required!"}
    }
}

export default AppPackagesController

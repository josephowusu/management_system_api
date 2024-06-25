import MySQL from "mysql"
import { Socket } from "socket.io"

import { authenticateSession, fullDateTime, generateID } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import StockTable from "../../../models/mainApp/inventory/StockTable"
import ProductInStockTable from "../../../models/mainApp/inventory/ProductInStockTable"
import ProductTable from "../../../models/mainApp/inventory/ProductTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"

interface socketBody {
    supplierID?:number
    invoiceDate?:string
    InvoiceNumber?:number
    totalAmount?:number
    itemList?:string|undefined
    currency?:string
    exchangeRate?:number
    macAddress:string
    schemaName:string
    stockHiddenID?:number
    sessionID:string|number
}

const StockController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody , callback:iSocketCallback) => {
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

            if (body.stockHiddenID) {
                if (privileges.Inventory?.updateExistingStocking == 'yes') {
                    updateStock(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            } else {
                if (privileges.Inventory?.addNewStocking == 'yes') {
                    addStock(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            }

        } else if (controllerType === 'fetch') {
            if (privileges.Inventory?.addNewStocking == 'yes' || 
            privileges.Inventory?.updateExistingStocking == 'yes' || 
            privileges.Inventory?.deactivateExistingStocking == 'yes' ||
            privileges.Inventory?.deleteExistingStocking == 'yes') {
                getStocks(socket, database, body, callback)
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

    const {supplierID, totalAmount, itemList, invoiceDate, exchangeRate, InvoiceNumber, currency, schemaName, sessionID, stockHiddenID} = body

    if (!stockHiddenID || !supplierID) {
        callback.status(200).json({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }
    
    const stockTable = new StockTable(undefined, database, schemaName)
    const productInStock = new ProductInStockTable(undefined, database, schemaName)

    const checker = await stockTable.get("id = ?", [stockHiddenID], 1, 0)
    if ( checker.length > 0 ) {

        const stocking = itemList ? JSON.parse(itemList) : null

        stockTable.setValues({
            id: stockHiddenID,
            supplierID: supplierID,
            invoiceDate: invoiceDate,
            InvoiceNumber: InvoiceNumber,
            totalAmount: totalAmount,
            itemList: itemList,
            currency: currency,
            exchangeRate: exchangeRate,
            sessionID: sessionID
        })

        const stockUpdateResult = await stockTable.update(["InvoiceNumber","currency","invoiceDate","itemList","totalAmount"])
        
        for (let index = 0; index < stocking.length; index++) {
        
            const stock = stocking[index]
    
            const checkInStock = await productInStock.get("productID = ?", [stock.product.split("**")[0]], 1, 0)
    
            if ( checkInStock.length > 0 ) {
                    
                productInStock.setValues({
                    id: checkInStock[0].id,
                    stockID: stockHiddenID,
                    productID: stock.product.split("**")[0],
                    quantity: checkInStock[0].quantity + stock.quantity,
                    barCode: '',
                    sessionID: sessionID
                })
    
                await productInStock.update(["quantity"])
    
            } else {
                
                productInStock.setValues({
                    stockID: stockHiddenID,
                    productID: stock.product.split("**")[0],
                    quantity: stock.quantity,
                    barCode: '',
                    sessionID: sessionID
                })
    
                await productInStock.save()
    
            }
    
        }

        if ( stockUpdateResult === "success" ) {

            callback({
                status: "success",
                message: "Stock added successfully"
            })
    
        } else {
    
            callback({
                status: "error",
                message: stockUpdateResult
            })
    
        }

        if ( stockUpdateResult == "success" ) {
            if (database && schemaName && sessionID && stockHiddenID) {
                Notifier(database, socket, schemaName, sessionID, userID, stockHiddenID, 'stock', "updated a stock", "updated an existing stock " + InvoiceNumber, "updateAction", 'inventoryPrivilege', 'updateExistingStocking')
            }
            callback({
                status: "success",
                message: "Stock has been updated successfully"
            })
            socket.broadcast.emit(schemaName+'/inventory/stock/insertUpdate', 'success')
            socket.emit(schemaName+'/inventory/stock/insertUpdate', 'success')
        } else {
    
            callback({
                status: "error",
                message: 'Failed to update stock'
            })
    
        }

    } else {
        callback({
            status: "error",
            message: "Cannot update invalid stock"
        })
    }

}

async function addStock(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {supplierID, totalAmount, itemList, invoiceDate, exchangeRate, InvoiceNumber, currency, macAddress, schemaName, sessionID} = body

    if (!supplierID) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const stockTable = new StockTable(undefined, database, schemaName)
    const productInStock = new ProductInStockTable(undefined, database, schemaName)

    const checkStock = await stockTable.get("invoiceNumber = ?", [InvoiceNumber], 1, 0)

    if ( checkStock.length > 0 ) {
        callback({
            status: "exists",
            message: "Stock with the same invoice number and type already exists!"
        })
        return
    }

    const stocking = itemList ? JSON.parse(itemList) : null

    stockTable.setValues({
        supplierID: supplierID,
        invoiceDate: invoiceDate,
        InvoiceNumber: InvoiceNumber,
        totalAmount: totalAmount,
        itemList: itemList,
        currency: currency,
        exchangeRate: exchangeRate,
        sessionID: sessionID
    })

    const stockSaveResult = await stockTable.save()

    for (let index = 0; index < stocking.length; index++) {
        
        const stock = stocking[index];

        const checkInStock = await productInStock.get("productID = ?", [stock.product.split("**")[0]], 1, 0)

        if ( checkInStock.length > 0 ) {
                
            productInStock.setValues({
                id: checkInStock[0].id,
                stockID: stockSaveResult.type === "success" ? stockSaveResult.primaryKey : undefined,
                productID: stock.product.split("**")[0],
                quantity: checkInStock[0].quantity + stock.quantity,
                barCode: '',
                sessionID: sessionID
            })

            await productInStock.update(["quantity"])

        } else {
            
            productInStock.setValues({
                stockID: stockSaveResult.type === "success" ? stockSaveResult.primaryKey : undefined,
                productID: stock.product.split("**")[0],
                quantity: stock.quantity,
                barCode: '',
                sessionID: sessionID
            })

            await productInStock.save()

        }

    }

    if ( stockSaveResult.type === "success" ) {

        callback({
            status: "success",
            message: "Stock added successfully"
        })

    } else {

        callback({
            status: "error",
            message: stockSaveResult.type
        })

    }


    if ( stockSaveResult.type == 'success' ) {

        if (database && schemaName && sessionID && stockSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, stockSaveResult.primaryKey, 'stock', "added a new stock", "added stock "+ InvoiceNumber, 'newInsertAction', 'inventoryPrivilege', 'addNewStocking')
        }
        callback({
            status: 'success',
            message: 'Stock has been added successfully',
            data: stockSaveResult.type == 'success' ? stockSaveResult.primaryKey : null
        })
        socket.broadcast.emit(schemaName+'/inventory/stock/insertUpdate', 'success')
        socket.emit(schemaName+'/inventory/stock/insertUpdate', 'success')

    } else {
        callback({
            status: "error",
            message: 'Failed to add stock'
        })

    }
    
}

async function getStocks(socket:Socket, database:MySQL.Connection|null, body:any, callback:any) {

    const {schemaName} = body
    const stock = new StockTable(undefined, database, schemaName)
    const allStock = await stock.getAll(10, 0)
    if ( allStock.length > 0) {
        callback({
            status: "success",
            data: allStock
        })
    } else {
        callback({
            status: "empty",
            message: "Stock list is empty"
        })
    }
}


export default StockController
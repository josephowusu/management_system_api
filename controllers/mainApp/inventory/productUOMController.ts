import MySQL from "mysql"
import { stringify } from "querystring"
import { Socket } from "socket.io"
import ProductTable from "../../../models/mainApp/inventory/ProductTable"
import FileWriter from "../../../modules/FileWriter"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"

interface socketBody {
    UOMAndPrice?:string
    macAddress:string
    schemaName:string
    productHiddenID?:number
    sessionID:string|number
}

const ProductUOMController = async (controllerType:'update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody , callback:iSocketCallback) => {
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

        if (controllerType === 'update') {
            if (body.productHiddenID) {
                if (privileges.Inventory?.updateExistingProductCategory == 'yes') {
                    updateProductPrices(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.Inventory?.addNewProduct == 'yes' || 
            privileges.Inventory?.updateExistingProduct == 'yes' || 
            privileges.Inventory?.deactivateExistingProduct == 'yes' ||
            privileges.Inventory?.deleteExistingProduct == 'yes') {
                getProductPrices(socket, database, body, callback)
            } else {
                callback({
                    status: 'warning',
                    message: 'You have no privilege to perform this task!'
                })
            }
            
        }
    }
}

export default ProductUOMController



async function updateProductPrices(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number){
    const {macAddress, schemaName, UOMAndPrice, productHiddenID, sessionID} = body

    const product = new ProductTable(undefined, database, schemaName)

    if (!productHiddenID || !UOMAndPrice) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const checker = await product.get("id = ?", [productHiddenID], 1, 0)
    if (checker.length > 0) {
        product.setValues({
            id: productHiddenID,
            UOMAndPrice: UOMAndPrice,
        })

        const productSaveResult = await product.update(["UOMAndPrice"])
    
        if ( productSaveResult == "success" ) {
            if (database && schemaName && sessionID && productHiddenID) {
                Notifier(database, socket, schemaName, sessionID, userID, productHiddenID, 'product', "updated a product", "updated an existing product", "updateAction", 'inventoryPrivilege', 'updateExistingProduct')
            }
            callback({
                status: "success",
                message: "Product has been updated successfully"
            })
            socket.broadcast.emit(schemaName+'/inventory/product/insertUpdate', 'success')
            socket.emit(schemaName+'/inventory/product/insertUpdate', 'success')
        } else {
    
            callback({
                status: "error",
                message: 'Failed to update product'
            })
    
        }
    }
}

async function getProductPrices(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {schemaName, productHiddenID} = body
    const product = new ProductTable(undefined, database, schemaName)
    const allPrices = await product.get("product.id = ?", [productHiddenID], 10, 0)
    if ( allPrices.length > 0) {
        const prices = allPrices[0].UOMAndPrice ? allPrices[0].UOMAndPrice : '[]'
        callback({
            status: "success",
            data: prices
        })
    } else {
        callback({
            status: "empty",
            message: "Product category list empty!"
        })
    }
}
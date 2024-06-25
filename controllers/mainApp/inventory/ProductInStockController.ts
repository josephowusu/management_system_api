import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import ProductInStockTable from "../../../models/mainApp/inventory/ProductInStockTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"

interface socketBody {
    name?:string
    macAddress?:string
    schemaName?:string
    ProductInStockHiddenID?:number
    sessionID:string|number
}


const ProductInStockController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
    
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

            if (body.ProductInStockHiddenID) {

                updateProductInStock(socket, database, body, callback)

            } else {

                addProductInStock(socket, database, body, callback)

            }

        } else if (controllerType === 'fetch') {

            getProductInStock(socket, database, body, callback)

        }
    }
}

async function updateProductInStock(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

}

async function addProductInStock(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

}

async function getProductInStock(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){
    const {schemaName} = body

    const productInStock = new ProductInStockTable(undefined, database, schemaName)
    const allProductInStock = await productInStock.getAll(10, 0)

    if ( allProductInStock.length > 0) {
        callback({
            status: "success",
            data: allProductInStock
        })
    } else {
        callback({
            status: "empty",
            message: "Product category list empty"
        })
    }
}



export default ProductInStockController
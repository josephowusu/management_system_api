import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"
import SalesTable from "../../../models/mainApp/pos/SalesTable"
import ProductInStockTable from "../../../models/mainApp/inventory/ProductInStockTable"


interface socketBody {
    clientID?:number|null
    purchaseSource?:string|undefined
    deliveryAddress?:string|undefined
    deliveryCost?:number|null
    country?:string
    currency?:string
    tax?:boolean
    itemList?:string
    discount?:number|null
    balance?:number|null
    paidAmount?:number
    paymentMethod?:string
    subTotal?:number
    grandTotal?:number
    companyBankID?:number|null
    walkInClientName?:string|undefined
    macAddress?:string
    schemaName?:string
    sessionID?:number|string
}


const SalesController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {

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
            console.log(privileges.POS?.addNewSales)
            if (privileges.POS?.addNewSales == 'yes') {
                addNewSales(socket, database, body, callback, userID)
            } else {
                callback({
                    status: 'warning',
                    message: 'You have no privilege to perform this task!'
                })
            }
        } else if (controllerType === 'fetch') {
            if (privileges.POS?.addNewSales == 'yes' || 
            privileges.POS?.updateExistingSale == 'yes' || 
            privileges.POS?.deactivateExistingSale == 'yes' ||
            privileges.POS?.deleteExistingSale == 'yes') {
                getSales(socket, database, body, callback, userID)
            }else {
                callback({
                    status: 'warning',
                    message: 'You have no privilege to perform this task!'
                })
            }
        }
    }
}


async function addNewSales(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number){
    const { clientID, purchaseSource, walkInClientName, deliveryAddress, deliveryCost, country, currency, tax, itemList, discount, balance, paidAmount, paymentMethod, subTotal, grandTotal, companyBankID, macAddress, schemaName, sessionID} = body
    
    if (!grandTotal || !itemList || !paymentMethod) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const list = JSON.parse(itemList)
    const productInStock = new ProductInStockTable(undefined, database, schemaName)
    const sales = new SalesTable(undefined, database, schemaName)
    
    for (let index = 0; index < list.length; index++) {
        const item = list[index]
        const checker = await productInStock.get("productInStock.id = ? and productInStock.productID = ?", [item.product.productInStockId, item.product.productId], 1, 0)
        if (checker.length) {
            const quantity = checker[0].quantity - item.quantity
            productInStock.setValues({
                id: checker[0].id,
                quantity: quantity,
            })
            const updatedProductInStock = await productInStock.update(["quantity"])
        }
    }

    sales.setValues({
        clientID: clientID ? clientID : null,
        purchaseSource: purchaseSource ? purchaseSource : undefined,
        deliveryAddress: deliveryAddress ? deliveryAddress : undefined,
        deliveryCost: deliveryCost ? deliveryCost : undefined,
        country: country ? country : undefined,
        currency: currency,
        tax: tax,
        itemList: itemList ? itemList : undefined,
        discount: discount,
        balance: balance ? balance : null,
        paidAmount: paidAmount ? paidAmount : 0,
        paymentMethod: paymentMethod ? paymentMethod : undefined,
        subTotal: subTotal ? subTotal : undefined,
        grandTotal: grandTotal,
        companyBankID: companyBankID ? companyBankID : null,
        walkInClientName: walkInClientName ? walkInClientName : undefined,
        sessionID: sessionID ? sessionID : null
    })

    const saveSalesResult = await sales.save()
    if (saveSalesResult.type === "success") {
        callback({
            status: "succuss",
            data: body
        })
    } else {
        callback({
            status: "failed",
            message: "Failed to make purchase"
        })
    }
}



async function updateSales(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number){
    


}

async function getSales(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number){
    
}


export default SalesController
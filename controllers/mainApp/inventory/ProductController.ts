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
    images?:string[] | string
    name?:string
    type?:string
    productCategoryID?:number
    manufacturerID?:number
    UOMAndPrice?:string
    productDescription?:string
    macAddress:string
    schemaName:string
    productHiddenID?:number
    updateFields?:any
    sessionID:string|number
}

const ProductController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody , callback:iSocketCallback) => {
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

            if (body.productHiddenID) {
                if (privileges.Inventory?.updateExistingProductCategory == 'yes') {
                    updateProduct(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.Inventory?.updateExistingProductCategory == 'yes') {
                    addProduct(socket, database, body, callback, userID)
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
                getAllProducts(socket, database, body, callback)
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
            message: 'Session has expired!'
        })
    }

}


async function updateProduct(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {macAddress, schemaName, name, type, images, productCategoryID, manufacturerID, UOMAndPrice, productDescription, productHiddenID, sessionID} = body

    const product = new ProductTable(undefined, database, schemaName)

    let imagesFileName = []
    if (images) {
        const fileUploader = new FileWriter(images, schemaName, '/products')
        let uploadResult = await fileUploader.__init__()
        for (let i = 0; i < uploadResult.length; i++) {
            imagesFileName.push(uploadResult[i].file)
        }
    }

    console.log(UOMAndPrice)

    if (!name) {
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
            images: images ? JSON.stringify(imagesFileName) : checker[0].images,
            name: name ? name : checker[0].name,
            type: type ? type : checker[0].type,
            productCategoryID: productCategoryID ? productCategoryID : checker[0].productCategoryID,
            manufacturerID: manufacturerID ? manufacturerID : checker[0].manufacturerID,
            UOMAndPrice: undefined,
            productDescription: productDescription ? productDescription : checker[0].productDescription
        })
    
        const productSaveResult = await product.update(["name","type","productDescription","manufacturerID","productCategoryID"])
    
        if ( productSaveResult == "success" ) {
            if (database && schemaName && sessionID && productHiddenID) {
                Notifier(database, socket, schemaName, sessionID, userID, productHiddenID, 'product', "updated a product", "updated an existing product " + name, "updateAction", 'inventoryPrivilege', 'updateExistingProduct')
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


async function addProduct(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {macAddress, schemaName, name, type, images, productCategoryID, manufacturerID, UOMAndPrice, productDescription, sessionID} = body

    if (!name || !productCategoryID || !productDescription) { //Add manufacturer ID
        callback({
            status: "error",
            message: "Some fields are required!"
        })
        return
    }
    
    const product = new ProductTable(undefined, database, schemaName)
    

    const productCheck = await product.get("name = ? AND type = ?", [name, type], 1, 0)
    if ( productCheck.length > 0 ) {
        callback({
            status: "exists",
            message: "Product with the same name and type already exists!"
        })
        return
    }

    let imagesFileName = []
    if (images) {
        const fileUploader = new FileWriter(images, schemaName, '/products')
        let uploadResult = await fileUploader.__init__()
        for (let i = 0; i < uploadResult.length; i++) {
            imagesFileName.push(uploadResult[i].file)
        }
    }

    product.setValues({
        images: JSON.stringify(imagesFileName),
        name: name,
        type: type,
        productCategoryID: productCategoryID,
        manufacturerID: 0,
        UOMAndPrice: UOMAndPrice,
        productDescription: productDescription,
        sessionID: sessionID
    })
    
    const productSaveResult = await product.save()

    if ( productSaveResult.type == 'success' ) {

        if (database && schemaName && sessionID && productSaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, productSaveResult.primaryKey, 'product', "added a new product", "added product "+ name, 'newInsertAction', 'inventoryPrivilege', 'addNewProduct')
        }
        callback({
            status: 'success',
            message: 'Product has been added successfully!',
            data: productSaveResult.type == 'success' ? productSaveResult.primaryKey : null
        })
        socket.broadcast.emit(schemaName+'/inventory/product/insertUpdate', 'success')
        socket.emit(schemaName+'/inventory/product/insertUpdate', 'success')

    } else {
        callback({
            status: "error",
            message: 'Failed to add product!'
        })
    }
}

async function getAllProducts(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const {schemaName, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found!"
        })
        return
    }

    const product = new ProductTable(undefined, database, schemaName)
    const allProduct = await product.getAll(10, 0)

    if ( allProduct.length > 0) {

        callback({
            status: "success",
            data: allProduct
        })

    } else {

        callback({
            status: "empty",
            message: "Product list empty!"
        })

    }

}

export default ProductController


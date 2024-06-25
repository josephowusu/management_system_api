import MySQL from "mysql"
import { Socket } from "socket.io"
import ProductCategoryTable from "../../../models/mainApp/inventory/ProductCategoryTable"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"
import Notifier from "../../../modules/Notifier"


interface socketBody {
    name?:string
    dependency?:number
    color?:string
    description?:string
    macAddress?:string
    schemaName?:string
    productCategoryHiddenID?:number
    sessionID:string|number
}

const ProductCategoryController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.productCategoryHiddenID) {

                if (privileges.Inventory?.updateExistingProductCategory == 'yes') {
                    updateProductCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }

            } else {
                if (privileges.Inventory?.addNewProductCategory == 'yes') {
                    addProductCategory(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }

        } else if (controllerType === 'fetch') {
            if (privileges.Inventory?.addNewProductCategory == 'yes' || 
            privileges.Inventory?.updateExistingProductCategory == 'yes' || 
            privileges.Inventory?.deactivateExistingProductCategory == 'yes' ||
            privileges.Inventory?.deleteExistingProductCategory == 'yes') {
                getProductCategory(socket, database, body, callback)
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


async function updateProductCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {macAddress, schemaName, name, dependency, color, description, productCategoryHiddenID, sessionID} = body

    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const productCategory = new ProductCategoryTable(undefined, database, schemaName)


    productCategory.setValues({
        id: productCategoryHiddenID,
        categoryName: name,
        dependency: dependency,
        color: color,
        description: description
    })

    const productCategoryUpdateResult = await productCategory.update(["categoryName", "dependency", "color", "description"])

    if ( productCategoryUpdateResult == "success" ) {
        if (database && schemaName && sessionID && productCategoryHiddenID) {
            Notifier(database, socket, schemaName, sessionID, userID, productCategoryHiddenID, 'productCategory', "updated a product Category", "updated an existing product Category " + name, "updateAction", 'inventoryPrivilege', 'updateExistingProductCategory')
        }
        callback({
            status: "success",
            message: "Product Category has been updated successfully!"
        })
        socket.broadcast.emit(schemaName+'/inventory/productCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/inventory/productCategory/insertUpdate', 'success')
    } else {

        callback({
            status: "error",
            message: 'Failed to update product category!'
        })

    }

}

async function addProductCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {

    const {macAddress, schemaName, name, dependency, color, description, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found"
        })
        return
    }

    //check if name is empty
    if (!name) {
        callback({
            status: "empty",
            message: "Some fields are required!"
        })
        return
    }

    const productCategory = new ProductCategoryTable(undefined, database, schemaName)

    //check if product exist with same name
    const checkProductName = await productCategory.get("name = ?", [name], 1, 0)

    if(checkProductName.length > 0) {
        callback({
            status: "exists",
            message: "A product category exists with the same name"
        })
        return
    }

    productCategory.setValues({
        categoryName: name,
        dependency: dependency,
        color: color,
        description: description,
        sessionID: sessionID
    })

    const productCategorySaveResult = await productCategory.save()

    if ( productCategorySaveResult.type === "success" ) {

        callback({
            status: "success",
            message: "Category added successfully"
        })

    } else {

        callback({
            status: "error",
            message: productCategorySaveResult
        })

    }

    if ( productCategorySaveResult.type == 'success' ) {

        if (database && schemaName && sessionID && productCategorySaveResult.primaryKey) {
            Notifier(database, socket, schemaName, sessionID, userID, productCategorySaveResult.primaryKey, 'productCategory', "added a new product Category", "added product Category "+ name, 'newInsertAction', 'inventoryPrivilege', 'addNewProductCategory')
        }
        callback({
            status: 'success',
            message: 'Product category has been added successfully!',
            data: productCategorySaveResult.type == 'success' ? productCategorySaveResult.primaryKey : null
        })
        socket.broadcast.emit(schemaName+'/inventory/productCategory/insertUpdate', 'success')
        socket.emit(schemaName+'/inventory/productCategory/insertUpdate', 'success')

    } else {
        callback({
            status: "error",
            message: 'Failed to add product category!'
        })

    }

}

async function getProductCategory(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){

    const {schemaName} = body
    const productCategory = new ProductCategoryTable(undefined, database, schemaName)
    const allProductCategory = await productCategory.getAll(10, 0)

    if ( allProductCategory.length > 0) {
        callback({
            status: "success",
            data: allProductCategory
        })
    } else {
        callback({
            status: "empty",
            message: "Product category list empty!"
        })
    }
}

export default ProductCategoryController
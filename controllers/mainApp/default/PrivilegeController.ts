import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "./AuthenticateController"
import DefaultPrivilegeTable from "../../../models/mainApp/default/DefaultPrivilegeTable"
import CRMPrivilegeTable from "../../../models/mainApp/crm/CRMPrivilegeTable"
import InventoryPrivilegeTable from "../../../models/mainApp/inventory/InventoryPrivilegeTable"
import MiniAccountPrivilegeTable from "../../../models/mainApp/miniAccount/MiniAccountPrivilegeTable"
import { getAllPrivilegeModels } from "../../../modules/PrivilegeModules"
import POSPrivilegeTable from "../../../models/mainApp/pos/POSprivilegeTable"


interface socketBody {
    employeeID:string | number 
    privilegeName?:any
    value?:boolean
    groupID?:number
    category?:string
    macAddress?:string
    schemaName:string
    sessionID:number|string
}



const PrivilegeController = async (controllerType:'fetch'|'insert/update'|'userPrivileges', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {

    if (!body.macAddress || !body.schemaName){
        callback({status: "Error", message: "Missing important parameter. Contact system administrator for support!"})
        return
    }
    
    const isSession = await authenticateSession(socket, database, body.macAddress, body.schemaName, body.sessionID)

    if (isSession.type !== "success") {
        callback({status: "Error", message: "Your session has expired"})
        return
    }

    if (isSession.type === 'success') {
        const userID = isSession.data?.userID ? isSession.data?.userID : 0
        const businessCode = isSession.data?.businessCode ? isSession.data?.businessCode : 'null'
        const schemaName = body.schemaName ? body.schemaName : ''
        let privileges:iPrivileges = {}
        if (database) {
            privileges = await fetchPrivileges(userID, businessCode, schemaName, database)
        }
        if (controllerType === 'insert/update') {

            insertUpdatePrivilege(socket, database, body, callback)

        } else if (controllerType === 'fetch') {

            getPrivilegeList(socket, database, body, callback)

        } else if (controllerType === 'userPrivileges') {

            getUserPrivilegeList(socket, database, body, callback)

        }
    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}

async function getUserPrivilegeList(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    let businessCode = body.schemaName.split("_")[1]
    let userID = body.employeeID
    let privileges:iPrivileges = {}
    if (database) {
        privileges = await fetchPrivileges(userID, businessCode, body.schemaName, database)
    }
    callback(privileges)
}


async function insertUpdatePrivilege(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    
    const { privilegeName, value, groupID, employeeID, schemaName } = body

    const defaultPrivilege = new DefaultPrivilegeTable(undefined, database, schemaName)
    const crmPrivilege = new CRMPrivilegeTable(undefined, database, schemaName)
    const inventoryPrivilege = new InventoryPrivilegeTable(undefined, database, schemaName)
    const miniAccountPrivilege = new MiniAccountPrivilegeTable(undefined, database, schemaName)
    const posPrivilege = new POSPrivilegeTable(undefined, database, schemaName)

    
    let result


    if (privilegeName && value !== undefined || privilegeName && value !== null) {
        const values:any = {}
        values[privilegeName] = value ? 'yes' : 'no'
       
        if (body.category === 'Default') {
            let check = await defaultPrivilege.get("userID = ?", [employeeID], 1, 0)
            if (check.length > 0) {
                defaultPrivilege.setValues({id: check[0].id, groupID: groupID ? groupID : undefined, ...values})
                result = await defaultPrivilege.update([privilegeName])
            } else {
                defaultPrivilege.setValues({userID: employeeID, groupID: groupID ? groupID : undefined, ...values})
                result = (await defaultPrivilege.save()).type
            }
        } else if (body.category === 'CRM') {
            let check = await crmPrivilege.get("userID = ?", [employeeID], 1, 0)
            if (check.length > 0) {
                crmPrivilege.setValues({id: check[0].id, groupID: groupID ? groupID : undefined, ...values})
                result = await crmPrivilege.update([privilegeName])
            } else {
                crmPrivilege.setValues({userID: employeeID, groupID: groupID ? groupID : undefined, ...values})
                result = (await crmPrivilege.save()).type
            }
        } else if (body.category === 'Inventory') {
            let check = await inventoryPrivilege.get("userID = ?", [employeeID], 1, 0)
            if (check.length > 0) {
                inventoryPrivilege.setValues({id: check[0].id, groupID: groupID ? groupID : undefined, ...values})
                result = await inventoryPrivilege.update([privilegeName])
            } else {
                inventoryPrivilege.setValues({userID: employeeID, groupID: groupID ? groupID : undefined, ...values})
                result = (await inventoryPrivilege.save()).type
            }
        } else if (body.category === 'MiniAccount') {
            let check = await miniAccountPrivilege.get("userID = ?", [employeeID], 1, 0)
            if (check.length > 0) {
                miniAccountPrivilege.setValues({id: check[0].id, groupID: groupID ? groupID : undefined, ...values})
                result = await miniAccountPrivilege.update([privilegeName])
            } else {
                miniAccountPrivilege.setValues({userID: employeeID, groupID: groupID ? groupID : undefined, ...values})
                result = (await miniAccountPrivilege.save()).type
            }
        } else if (body.category === 'POS') {
            let check = await posPrivilege.get("userID = ?", [employeeID], 1, 0)
            if (check.length > 0) {
                posPrivilege.setValues({id: check[0].id, groupID: groupID ? groupID : undefined, ...values})
                result = await posPrivilege.update([privilegeName])
            } else {
                posPrivilege.setValues({userID: employeeID, groupID: groupID ? groupID : undefined, ...values})
                result = (await posPrivilege.save()).type
            }
        }

        callback({status: result, message: result === 'success' ? '' : 'Something went wrong!!'})
    } else {
        callback({status: 'error', message: 'Something went wrong!'})
    }

}



async function getPrivilegeList(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    const {schemaName} = body

    const result = getAllPrivilegeModels(database, schemaName, 'columnsList')

    callback(result)
}



export default PrivilegeController




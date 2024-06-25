import { Socket } from "socket.io"
import { authenticateSession, fullDate } from "../../../modules/GeneralModules"
import { iAuthenticateBody, iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import MySQL from "mysql"
import SoftwarePurchaseTable from "../../../models/core/SoftwarePurchaseTable"
import DefaultPrivilegeTable from "../../../models/mainApp/default/DefaultPrivilegeTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import CRMPrivilegeTable from "../../../models/mainApp/crm/CRMPrivilegeTable"
import InventoryPrivilegeTable from "../../../models/mainApp/inventory/InventoryPrivilegeTable"
import MiniAccountPrivilegeTable from "../../../models/mainApp/miniAccount/MiniAccountPrivilegeTable"
import POSPrivilegeTable from "../../../models/mainApp/pos/POSprivilegeTable"


const AuthenticateController = async (socket:Socket, database:MySQL.Connection|null, body:iAuthenticateBody, callback:iSocketCallback) => {

    const isSession = await authenticateSession(socket, database, body.macAddress, body.schemaName, body.sessionID)

    if (isSession.type === 'success') {
        const userID = isSession.data?.userID ? isSession.data?.userID : 0
        const businessCode = isSession.data?.businessCode ? isSession.data?.businessCode : 'null'
        const schemaName = body.schemaName
        let privileges:iPrivileges = {}
        if (database) {
            privileges = await fetchPrivileges(userID, businessCode, schemaName, database)
        }

        callback(privileges)
    }

    callback({type: isSession.type, message: isSession.message})
    
    return
}


export const fetchPrivileges = async (userId:string|number, businessCode:string, schemaName:string, database:MySQL.Connection) => {
    const privileges:iPrivileges = {}
    const purchaseTable = new SoftwarePurchaseTable(undefined, database, process.env.CORE_DB_NAME)
    let packages = await purchaseTable.get('businessCode = ? AND endOfSubscriptionDate >= ?', [businessCode, fullDate()], 10, 0)
    
    if (packages.length) {
        let featuresList:string[] = []
        for (let i = 0; i < packages.length; i++) {
            const packageData = packages[i]
            let features = JSON.parse(packageData.features)
            if (Array.isArray(features) && features.length) {
                for (let j = 0; j < features.length; j++) {
                    if (!featuresList.includes(features[j])) {
                        featuresList.push(features[j])
                    }
                }
            }
        }

        for (let i = 0; i < featuresList.length; i++) {
            const feature = featuresList[i]

            if (feature === 'AppDefault') {

                const privilegeTable = new DefaultPrivilegeTable(undefined, database, schemaName)
                let result = await privilegeTable.get('userID = ?', [userId], 1, 0)
                privileges.Default = Array.isArray(result) && result.length ? result[0] : {}

            } else if (feature === 'CustomerRelationshipManagement') {
                
                const privilegeTable = new CRMPrivilegeTable(undefined, database, schemaName)
                let result = await privilegeTable.get('userID = ?', [userId], 1, 0)
                privileges.CRM = Array.isArray(result) && result.length ? result[0] : {}

            } else if (feature === 'Inventory') {

                const privilegeTable = new InventoryPrivilegeTable(undefined, database, schemaName)
                let result = await privilegeTable.get('userID = ?', [userId], 1, 0)
                privileges.Inventory = Array.isArray(result) && result.length ? result[0] : {}
                
            } else if (feature === 'MiniAccount') {
                
                const privilegeTable = new MiniAccountPrivilegeTable(undefined, database, schemaName)
                let result = await privilegeTable.get('userID = ?', [userId], 1, 0)
                privileges.MiniAccount = Array.isArray(result) && result.length ? result[0] : {}
                
            } else if (feature === 'POS') {
                
                const privilegeTable = new POSPrivilegeTable(undefined, database, schemaName)
                let result = await privilegeTable.get('userID = ?', [userId], 1, 0)
                privileges.POS = Array.isArray(result) && result.length ? result[0] : {}
                
            }
        }
    }

    return privileges
}

export default AuthenticateController
import MySql from 'mysql'
import DefaultPrivilegeTable from '../models/mainApp/default/DefaultPrivilegeTable'
import CRMPrivilegeTable from '../models/mainApp/crm/CRMPrivilegeTable'
import InventoryPrivilegeTable from '../models/mainApp/inventory/InventoryPrivilegeTable'
import MiniAccountPrivilegeTable from '../models/mainApp/miniAccount/MiniAccountPrivilegeTable'
import POSPrivilegeTable from '../models/mainApp/pos/POSprivilegeTable'

export type iPrivilegeTableNames = 'defaultPrivilege'|'crmPrivilege'|'inventoryPrivilege'|'miniAccountPrivilege'|'posPrivilege'

export const getAllPrivilegeModels = (database:MySql.Connection|null, schemaName:string, type:'columnsList'|'models'|iPrivilegeTableNames) => {

    const defaultPrivilege = new DefaultPrivilegeTable(undefined, database, schemaName)
    const crmPrivilege = new CRMPrivilegeTable(undefined, database, schemaName)
    const inventoryPrivilege = new InventoryPrivilegeTable(undefined, database, schemaName)
    const miniAccountPrivilege = new MiniAccountPrivilegeTable(undefined, database, schemaName)
    const posPrivilege = new POSPrivilegeTable(undefined, database, schemaName)

    const privilegeObject = {
        defaultPrivilege,
        crmPrivilege,
        inventoryPrivilege,
        miniAccountPrivilege,
        posPrivilege
    }

    if (type === 'columnsList') {
        return [
            {
                name: "Default",
                title: 'Administration',
                columns: defaultPrivilege.columnsList()
            },
            {
                name: "CRM",
                title: 'Customer Relationship Manager',
                columns: crmPrivilege.columnsList()
            },
            {
                name: "Inventory",
                title: 'Inventory',
                columns: inventoryPrivilege.columnsList(),
            },
            {
                name: "MiniAccount",
                title: 'Mini Account',
                columns: miniAccountPrivilege.columnsList()
            },
            {
                name: "POS",
                title: "Point Of Sales",
                columns: posPrivilege.columnsList()
            }
        ]
    } else if (type === 'models') {
        return privilegeObject
    } else {
        if (privilegeObject[type]) {
            return privilegeObject[type]
        }

        return null
    }
}
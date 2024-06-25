import MySQL from "mysql"
import { dbQuery, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iInventoryPrivilege, iInventoryPrivilegeUpdatableColumns } from "../../../modules/interfaces/inventory/iInventoryPrivilege"



class InventoryPrivilegeTable {
    
    private dataObject:iInventoryPrivilege
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iInventoryPrivilege, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iInventoryPrivilege) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.inventoryPrivilege 
                (id, userID, groupID, addNewProduct, updateExistingProduct, deactivateExistingProduct, deleteExistingProduct, addNewProductCategory, updateExistingProductCategory, deactivateExistingProductCategory, deleteExistingProductCategory, addNewStocking, updateExistingStocking, deactivateExistingStocking, deleteExistingStocking, addNewSupplier, updateExistingSupplier, deactivateExistingSupplier, deleteExistingSupplier, assignAllPrivileges) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.groupID, 
                this.dataObject.addNewProduct, this.dataObject.updateExistingProduct, this.dataObject.deactivateExistingProduct,
                this.dataObject.deleteExistingProduct, this.dataObject.addNewProductCategory, this.dataObject.updateExistingProductCategory,
                this.dataObject.deactivateExistingProductCategory, this.dataObject.deleteExistingProductCategory, this.dataObject.addNewStocking, this.dataObject.updateExistingStocking, 
                this.dataObject.deactivateExistingStocking, this.dataObject.deleteExistingStocking, this.dataObject.addNewSupplier,
                this.dataObject.updateExistingSupplier, this.dataObject.deactivateExistingSupplier, this.dataObject.deleteExistingSupplier,
                this.dataObject.assignAllPrivileges
            ], 
            this.database) 
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'inventoryPrivilegeTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'inventoryPrivilegeTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iInventoryPrivilegeUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.inventoryPrivilege ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'inventoryPrivilegeTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'inventoryPrivilegeTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.inventoryPrivilege WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'inventoryPrivilegeTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.inventoryPrivilege LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'inventoryPrivilegeTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'inventoryPrivilege',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'groupID', dataType: 'BIGINT(100)'},
                {columnName: 'addNewProduct', dataType: 'varchar(5)'},
                {columnName: 'updateExistingProduct', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingProduct', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingProduct', dataType: 'varchar(5)'},
                {columnName: 'addNewProductCategory', dataType: 'varchar(5)'},
                {columnName: 'updateExistingProductCategory', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingProductCategory', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingProductCategory', dataType: 'varchar(5)'},
                {columnName: 'addNewStocking', dataType: 'varchar(5)'},
                {columnName: 'updateExistingStocking', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingStocking', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingStocking', dataType: 'varchar(5)'},
                {columnName: 'addNewSupplier', dataType: 'varchar(5)'},
                {columnName: 'updateExistingSupplier', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingSupplier', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingSupplier', dataType: 'varchar(5)'},
                {columnName: 'assignAllPrivileges', dataType: 'varchar(5)'}
            ],
            alterColumns: [],
            foreignKeys: []
        }
    }

    public columnsList() {
        return [
            {
              title: "Assign All Privileges",
              name: "assignAllPrivileges",
              description: "User will be able to grant full access and permissions.",
            },
            {
                title: "Add New Product",
                name: "addNewProduct",
                description: "User will be able to create a new product.",
              },
              {
                title: "Update Existing Product",
                name: "updateExistingProduct",
                description:
                  "User will be able to make changes to a product that is already existing.",
              },
              {
                title: "Deactivate Existing Product",
                name: "deactivateExistingProduct",
                description: "User will be able to disconnect a product that already exists.",
              },
              {
                title: "Delete Existing Product",
                name: "deleteExistingProduct",
                description: "User will be able to remove a product that already exists.",
              },
              {
                title: "Add New Product Category",
                name: "addNewProductCategory",
                description: "User will be able to create a new group of products.",
              },
              {
                title: "Update Existing Product Category",
                name: "updateExistingProductCategory",
                description:
                  "User will be able to make changes to a product group that already exists.",
              },
              {
                title: "Deactivate Existing Product Category",
                name: "deactivateExistingProductCategory",
                description:
                  "User will be able to disconnect a product group that already exists.",
              },
              {
                title: "Delete Existing Product Category",
                name: "deleteExistingProductCategory",
                description:
                  "User will be able to remove a product group that already exists.",
              },
              {
                title: "Add New Stocking",
                name: "addNewStocking",
                description: "User will be able to create a new stocking.",
              },
              {
                title: "Update Existing Stocking",
                name: "updateExistingStocking",
                description:
                  "User will be able to make changes to a stocking that is already existing.",
              },
            
              {
                title: "Deactivate Existing Stocking",
                name: "deactivateExistingStocking",
                description: "User will be able to disconnect a stocking that already exists.",
              },
              {
                title: "Delete Existing Stocking",
                name: "deleteExistingStocking",
                description: "User will be able to remove a stocking that already exists.",
              },
              {
                title: "Add New Supplier",
                name: "addNewSupplier",
                description: "User will be able to create a new supplier.",
              },
              {
                title: "Update Existing Supplier",
                name: "updateExistingSupplier",
                description:
                  "User will be able to make changes to a supplier that is already existing.",
              },
              {
                title: "Deactivate Existing Supplier",
                name: "deactivateExistingSupplier",
                description: "User will be able to disconnect a supplier that already exists.",
              },
              {
                title: "Delete Existing Supplier",
                name: "deleteExistingSupplier",
                description: "User will be able to remove a supplier that already exists.",
              },
        ]
    }
}

export default InventoryPrivilegeTable
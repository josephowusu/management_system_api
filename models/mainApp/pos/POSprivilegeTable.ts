import MySQL from "mysql"
import { dbQuery, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iInventoryPrivilege, iInventoryPrivilegeUpdatableColumns } from "../../../modules/interfaces/inventory/iInventoryPrivilege"
import { iPOSPrivilege, iPOSPrivilegeUpdatableColumns } from "../../../modules/interfaces/pos/iPOSPrivilege"



class POSPrivilegeTable {
    
    private dataObject:iPOSPrivilege
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iPOSPrivilege, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iPOSPrivilege) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.posPrivilege 
                (id, userID, groupID, addNewSales, updateExistingSale, deactivateExistingSale, 
                    deleteExistingSale, assignAllPrivileges) 
                VALUES (?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.groupID, 
                this.dataObject.addNewSales, this.dataObject.updateExistingSale, 
                this.dataObject.deactivateExistingSale, this.dataObject.deleteExistingSale,
                this.dataObject.assignAllPrivileges
            ], 
            this.database) 
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'posPrivilegeTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'posPrivilegeTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iPOSPrivilegeUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.posPrivilege ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'posPrivilegeTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'posPrivilegeTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.posPrivilege WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'posPrivilegeTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.posPrivilege LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'posPrivilegeTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'posPrivilege',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'groupID', dataType: 'BIGINT(100)'},
                
                {columnName: 'addNewSales', dataType: 'varchar(5)'},
                {columnName: 'updateExistingSale', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingSale', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingSale', dataType: 'varchar(5)'},
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
                title: "Add New Sale",
                name: "addNewSales",
                description: "User will be able to add a new sale.",
            },
            {
                title: "Update Existing Sale",
                name: "updateExistingSale",
                description:
                "User will be able to make changes to a sale that is already existing.",
            },
            {
                title: "Deactivate Existing Sale",
                name: "deactivateExistingSale",
                description: "User will be able to disconnect a sale that already exists.",
            },
            {
                title: "Delete Existing Sale",
                name: "deleteExistingSale",
                description: "User will be able to remove a sale that already exists.",
            }
        ]
    }
}

export default POSPrivilegeTable
import MySQL from "mysql"

import { dbQuery, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iDefaultPrivilege, iDefaultPrivilegeUpdatableColumns } from "../../../modules/interfaces/default/iDefaultPrivilege"


class DefaultPrivilegeTable {
    
    private dataObject:iDefaultPrivilege
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iDefaultPrivilege, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iDefaultPrivilege) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.defaultPrivilege 
                (id, userID, groupID, assignAllPrivileges, addNewUser, updateExistingUser, deactivateExistingUser, deleteExistingUser, addNewEmployee, 
                    updateExistingEmployee, deactivateExistingEmployee, deleteExistingEmployee, 
                    addNewManufacturer, updateExistingManufacturer, deactivateExistingManufacturer, deleteExistingManufacturer, addNewService, 
                    updateExistingService, deactivateExistingService, deleteExistingService, addNewDepartment, 
                    updateExistingDepartment, deactivateExistingDepartment, deleteExistingDepartment, updateBusinessProfile) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.groupID, 
                this.dataObject.assignAllPrivileges, this.dataObject.addNewUser, this.dataObject.updateExistingUser,
                this.dataObject.deactivateExistingUser, this.dataObject.deleteExistingUser, this.dataObject.addNewEmployee,
                this.dataObject.updateExistingEmployee, this.dataObject.deactivateExistingEmployee, this.dataObject.deleteExistingEmployee,
                this.dataObject.addNewManufacturer, this.dataObject.updateExistingManufacturer,
                this.dataObject.deactivateExistingManufacturer, this.dataObject.deleteExistingManufacturer, this.dataObject.addNewService,
                this.dataObject.updateExistingService, this.dataObject.deactivateExistingService, this.dataObject.deleteExistingService,
                this.dataObject.addNewDepartment, this.dataObject.updateExistingDepartment, this.dataObject.deactivateExistingDepartment, 
                this.dataObject.deleteExistingDepartment, this.dataObject.updateBusinessProfile
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'defaultPrivilegeTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'defaultPrivilegeTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iDefaultPrivilegeUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.defaultPrivilege ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'defaultPrivilegeTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'defaultPrivilegeTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.defaultPrivilege WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'defaultPrivilegeTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.defaultPrivilege LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'defaultPrivilegeTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'defaultPrivilege',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'groupID', dataType: 'BIGINT(100)'},
                {columnName: 'assignAllPrivileges', dataType: 'varchar(5)'},
                {columnName: 'addNewUser', dataType: 'varchar(5)'},
                {columnName: 'updateExistingUser', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingUser', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingUser', dataType: 'varchar(5)'},
                {columnName: 'addNewEmployee', dataType: 'varchar(5)'},
                {columnName: 'updateExistingEmployee', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingEmployee', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingEmployee', dataType: 'varchar(5)'},
                {columnName: 'addNewManufacturer', dataType: 'varchar(5)'},
                {columnName: 'updateExistingManufacturer', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingManufacturer', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingManufacturer', dataType: 'varchar(5)'},
                {columnName: 'addNewService', dataType: 'varchar(5)'},
                {columnName: 'updateExistingService', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingService', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingService', dataType: 'varchar(5)'},
                {columnName: 'addNewDepartment', dataType: 'varchar(5)'},
                {columnName: 'updateExistingDepartment', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingDepartment', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingDepartment', dataType: 'varchar(5)'},
                {columnName: 'updateBusinessProfile', dataType: 'varchar(5)'},
            ],
            alterColumns: [
              { columnName: 'addNewManufacturer', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'updateExistingManufacturer', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'deactivateExistingManufacturer', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'deleteExistingManufacturer', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'addNewService', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'updateExistingService', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'deactivateExistingService', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'deleteExistingService', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'addNewDepartment', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'updateExistingDepartment', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'deactivateExistingDepartment', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'deleteExistingDepartment', dataType: 'varchar(5)', addOrDrop: 'add' },
              { columnName: 'updateBusinessProfile', dataType: 'varchar(5)', addOrDrop: 'add' }
            ],
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
                title: "Add New User",
                name: "addNewUser",
                description: "User will be able to add new users to existing users.",
              },
              {
                title: "Update Existing User",
                name: "updateExistingUser",
                description: "User will be able to improve details of existing users.",
              },
              {
                title: "Deactivate Existing User",
                name: "deactivateExistingUser",
                description:
                  "User will be able to make existing users inactive without deleting user's account.",
              },
              {
                title: "Delete Existing User",
                name: "deleteExistingUser",
                description:
                  "User will be able to permanently remove existing users from list of users.",
              },
              {
                title: "Add New Employee",
                name: "addNewEmployee",
                description:
                  "User will be able to add new employees to existing employees.",
              },
              {
                title: "Update Existing Employee",
                name: "updateExistingEmployee",
                description: "User will be able to improve details of existing employees.",
              },
              {
                title: "Deactivate Existing Employee",
                name: "deactivateExistingEmployee",
                description:
                  "User will be able to make existing employees inactive without deleting employee's account.",
              },
              {
                title: "Delete Existing Employee",
                name: "deleteExistingEmployee",
                description:
                  "User will be able to permanently remove existing employees from list of employees.",
              },
              {
                title: "Add New Manufacturer",
                name: "addNewManufacturer",
                description:
                  "User will be able to add new manufacturers to existing manufacturers.",
              },
              {
                title: "Update Existing Manufacturer",
                name: "updateExistingManufacturer",
                description:
                  "User will be able to improve details of existing manufacturers.",
              },
              {
                title: "Deactivate Existing Manufacturer",
                name: "deactivateExistingManufacturer",
                description:
                  "User will be able to make existing manufacturers inactive without deleting manufacturer's account.",
              },
              {
                title: "Delete Existing Manufacturer",
                name: "deleteExistingManufacturer",
                description:
                  "User will be able to permanently remove existing manufacturers from list of manufacturers",
              },
              {
                title: "Add New Service",
                name: "addNewService",
                description: "User will be able to add new services to existing services.",
              },
              {
                title: "Update Existing Service",
                name: "updateExistingService",
                description:
                  "User will be able to improve details about existing services.",
              },
              {
                title: "Deactivate Existing Service",
                name: "deactivateExistingService",
                description:
                  "User will be able to make existing services inactive without deleting them.",
              },
              {
                title: "Delete Existing Service",
                name: "deleteExistingService",
                description:
                  "User will be able to permanently remove existing services from list of services.",
              },
              {
                title: "Add New Department",
                name: "addNewDepartment",
                description:
                  "User will be able to add new departments to existing departments.",
              },
              {
                title: "Update Existing Department",
                name: "updateExistingDepartment",
                description:
                  "User will be able to improve details about existing departments.",
              },
              {
                title: "Deactivate Existing Department",
                name: "deactivateExistingDepartment",
                description:
                  "User will be able to make existing departments inactive without deleting them.",
              },
              {
                title: "Delete Existing Department",
                name: "deleteExistingDepartment",
                description:
                  "User will be able to permanently remove existing departments from list of departments.",
              },
        ]
    }
}

export default DefaultPrivilegeTable

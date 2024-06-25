import MySQL from "mysql"
import { dbQuery, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iHRPrivilege, iHRPrivilegeUpdatableColumns } from "../../../modules/interfaces/hr/iHRPrivilege"


class HRPrivilegeTable {
    
    private dataObject:iHRPrivilege
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iHRPrivilege, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iHRPrivilege) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.HRPrivilege 
                (id, userID, groupID, addNewTier, updateExistingTier, deactivateExistingTier, deleteExistingTier,
                    addNewRole, updateExistingRole, deactivateExistingRole, deleteExistingRole, addNewAssignRole, updateExistingAssignRole, deactivateExistingAssignRole, deleteExistingAssignRole, 
                    assignHRPrivileges) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.groupID, 
                this.dataObject.addNewTier, this.dataObject.updateExistingTier, this.dataObject.deactivateExistingTier,
                this.dataObject.deleteExistingTier, this.dataObject.addNewRole,this.dataObject.updateExistingRole, this.dataObject.deactivateExistingRole, this.dataObject.deleteExistingRole, 
                this.dataObject.addNewAssignRole,this.dataObject.updateExistingAssignRole, this.dataObject.deactivateExistingAssignRole, this.dataObject.deleteExistingAssignRole,
                this.dataObject.assignHRPrivileges
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'HRPrivilegeTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'HRPrivilegeTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iHRPrivilegeUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.HRPrivilege ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'HRPrivilegeTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'HRPrivilegeTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.HRPrivilege WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'HRPrivilegeTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.HRPrivilege LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'HRPrivilegeTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'HRPrivilege',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'groupID', dataType: 'BIGINT(100)'},
                {columnName: 'addNewTier', dataType: 'varchar(5)'},
                {columnName: 'updateExistingTier', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingTier', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingTier', dataType: 'varchar(5)'},
                {columnName: 'addNewRole', dataType: 'varchar(5)'},
                {columnName: 'updateExistingRole', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingRole', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingRole', dataType: 'varchar(5)'},
                {columnName: 'addNewAssignRole', dataType: 'varchar(5)'},
                {columnName: 'updateExistingAssignRole', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingAssignRole', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingAssignRole', dataType: 'varchar(5)'},
                {columnName: 'assignHRPrivileges', dataType: 'varchar(5)'}
                
            ],
            alterColumns: [],
            foreignKeys: []
        }
    }

    public columnsList() {
        return [
            {
            title: "Assign All Privileges",
            name: "assignHRPrivileges",
            description:
                "User will be able to allot all HR privileges to existing tier.",
            },
            {
            title: "Add New Tier",
            name: "addNewTier",
            description: "User will be able to add new tier to existing tier.",
            },
            {
            title: "Update Existing Tier",
            name: "updateExistingTier",
            description: "User will be able to improve details of existing tier.",
            },
            {
            title: "Deactivate Existing Tier",
            name: "deactivateExistingTier",
            description:
                "User will be able to make existing tiers inactive without deleting tier's account.",
            },
            {
            title: "Delete Existing Tier",
            name: "deleteExistingTier",
            description:
                "User will be able to permanently remove existing tiers from list of tier.",
            },
            {
                title: "Add New Role",
                name: "addNewRole",
                description: "User will be able to add new role to existing role.",
                },
                {
                title: "Update Existing Role",
                name: "updateExistingRole",
                description: "User will be able to improve details of existing role.",
                },
                {
                title: "Deactivate Existing Role",
                name: "deactivateExistingRole",
                description:
                    "User will be able to make existing roles inactive without deleting role's account.",
                },
                {
                title: "Delete Existing Role",
                name: "deleteExistingRole",
                description:
                    "User will be able to permanently remove existing roles from list of roles.",
                },

                {
                    title: "Add New Assign Role",
                    name: "addNewRole",
                    description: "User will be able to add new assign role to existing assign role.",
                },
                {
                    title: "Update Existing Assign Role",
                    name: "updateExistingRole",
                    description: "User will be able to improve details of existing assign role.",
                },
                {
                    title: "Deactivate Existing Assign Role",
                    name: "deactivateExistingRole",
                    description:"User will be able to make existing roles inactive without deleting assign role account.",
                },
                {
                    title: "Delete Existing Assign Role",
                    name: "deleteExistingRole",
                    description:"User will be able to permanently remove existing assign roles from list of assign role.",
                },
            
        ]
    }
}

export default HRPrivilegeTable
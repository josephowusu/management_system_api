import MySQL from "mysql"
import { dbQuery, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iCRMPrivilege, iCRMPrivilegeUpdatableColumns } from "../../../modules/interfaces/crm/iCRMPrivilege"


class CRMPrivilegeTable {
    
    private dataObject:iCRMPrivilege
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iCRMPrivilege, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iCRMPrivilege) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.CRMPrivilege 
                (id, userID, groupID, addNewClient, updateExistingClient, deactivateExistingClient, 
                    deleteExistingClient, addNewClientCategory, updateExistingClientCategory, 
                    deactivateExistingClientCategory, deleteExistingClientCategory, sendBulkSMS, sendBulkEmail, 
                    assignCRMPrivileges) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.groupID, 
                this.dataObject.addNewClient, this.dataObject.updateExistingClient, this.dataObject.deactivateExistingClient,
                this.dataObject.deleteExistingClient, this.dataObject.addNewClientCategory, this.dataObject.updateExistingClientCategory,
                this.dataObject.deactivateExistingClientCategory, this.dataObject.deleteExistingClientCategory, 
                this.dataObject.sendBulkSMS, this.dataObject.sendBulkEmail, this.dataObject.assignCRMPrivileges
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'CRMPrivilegeTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'CRMPrivilegeTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iCRMPrivilegeUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.CRMPrivilege ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'CRMPrivilegeTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'CRMPrivilegeTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.CRMPrivilege WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'CRMPrivilegeTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.CRMPrivilege LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'CRMPrivilegeTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'CRMPrivilege',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'groupID', dataType: 'BIGINT(100)'},
                {columnName: 'addNewClient', dataType: 'varchar(5)'},
                {columnName: 'updateExistingClient', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingClient', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingClient', dataType: 'varchar(5)'},
                {columnName: 'sendBulkSMS', dataType: 'varchar(5)'},
                {columnName: 'sendBulkEmail', dataType: 'varchar(5)'},
                {columnName: 'assignCRMPrivileges', dataType: 'varchar(5)'}
            ],
            alterColumns: [
                {columnName: 'addNewClientCategory', dataType: 'varchar(5)', addOrDrop:"add"},
                {columnName: 'updateExistingClientCategory', dataType: 'varchar(5)', addOrDrop:"add"},
                {columnName: 'deactivateExistingClientCategory', dataType: 'varchar(5)', addOrDrop:"add"},
                {columnName: 'deleteExistingClientCategory', dataType: 'varchar(5)', addOrDrop:"add"},
            ],
            foreignKeys: []
        }
    }

    public columnsList() {
        return [
            {
            title: "Assign All Privileges",
            name: "assignCRMPrivileges",
            description:
                "User will be able to allot all CRM privileges to existing clients.",
            },
            {
            title: "Add New Client",
            name: "addNewClient",
            description: "User will be able to add new clients to existing clients.",
            },
            {
            title: "Update Existing Client",
            name: "updateExistingClient",
            description: "User will be able to improve details of existing clients.",
            },
            {
            title: "Deactivate Existing Client",
            name: "deactivateExistingClient",
            description:
                "User will be able to make existing clients inactive without deleting client's account.",
            },
            {
            title: "Delete Existing Client",
            name: "deleteExistingClient",
            description:
                "User will be able to permanently remove existing clients from list of clients.",
            },
            {
            title: "Add New Client Category",
            name: "addNewClientCategory",
            description: "User will be able to add new client category to existing client categories.",
            },
            {
            title: "Update Existing Client Category",
            name: "updateExistingClientCategory",
            description: "User will be able to improve details of existing client categories.",
            },
            {
            title: "Deactivate Existing Client Category",
            name: "deactivateExistingClientCategory",
            description:
                "User will be able to make existing client category inactive without deleting client category.",
            },
            {
            title: "Delete Existing Client Category",
            name: "deleteExistingClientCategory",
            description:
                "User will be able to permanently remove existing client category from list of client category",
            },
            {
            title: "Send Bulk SMS",
            name: "sendBulkSMS",
            description:
                "User will be able to send SMS to a large list of recipients instantly.",
            },
            {
            title: "Send Bulk Email",
            name: "sendBulkEmail",
            description:
                "User will be able to send emails to a large list of recipients instantly.",
            },
        ]
    }
}

export default CRMPrivilegeTable
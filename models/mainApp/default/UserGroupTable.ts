import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"

import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iUserGroup, iUserGroupUpdatableColumns } from "../../../modules/interfaces/default/iUserGroupTable"


class UserGroupTable {

    private dataObject:iUserGroup
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iUserGroup, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iUserGroup) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.service 
                (id, name, description, sessionID, status, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.name, this.dataObject.description, this.dataObject.sessionID, this.dataObject.status, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'ServiceTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'ServiceTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iUserGroupUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.service ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'ServiceTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'ServiceTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.service WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'ServiceTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.service LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'ServiceTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'service',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'name', dataType: 'varchar(200)'},
                {columnName: 'description', dataType: 'text'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default UserGroupTable
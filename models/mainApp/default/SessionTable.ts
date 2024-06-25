import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iSessionData, iSessionUpdatableColumns } from "../../../modules/interfaces/default/iSessionTable"


class SessionTable {

    private dataObject:iSessionData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iSessionData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iSessionData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.session 
                (id, userID, loginDateAndTime, logoutDateAndTime, token) 
                VALUES (?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.loginDateAndTime, 
                this.dataObject.logoutDateAndTime, this.dataObject.token
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'SessionTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'SessionTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iSessionUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.session ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'SessionTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'SessionTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT user.*, session.* FROM ${this.schema}.session 
                LEFT JOIN ${this.schema}.user ON ${this.schema}.user.id = ${this.schema}.session.userID
                WHERE ${search} LIMIT ${limit} OFFSET ${offset}
            `, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SessionTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT user.*, session.* FROM ${this.schema}.session 
                LEFT JOIN ${this.schema}.user ON ${this.schema}.user.id = ${this.schema}.session.userID
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SessionTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'session',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'loginDateAndTime', dataType: 'datetime'},
                {columnName: 'logoutDateAndTime', dataType: 'datetime'},
                {columnName: 'token', dataType: 'longtext'},
                {columnName: 'logoutType', dataType: 'varchar(50)'},
                {columnName: 'unauthorizedAccessData', dataType: 'longtext'}
            ],
            alterColumns: [],
            foreignKeys: []
        }
    }
}

export default SessionTable


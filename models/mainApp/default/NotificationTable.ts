import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iNotificationTable, iNotificationTableUpdatableColumns } from "../../../modules/interfaces/default/iNotificationTable"


class NotificationTable {

    private dataObject:iNotificationTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iNotificationTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID()}
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iNotificationTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.notification 
                (id, title, message, type, readList, usersList, mainTableID, mainTableName, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.title, this.dataObject.message, 
                this.dataObject.type, this.dataObject.readList,  this.dataObject.usersList, this.dataObject.mainTableID,
                this.dataObject.mainTableName, this.dataObject.sessionID, this.dataObject.createdAt
            ],
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id, createdAt: this.dataObject.createdAt}
            } else {
                Logger.log('error', 'notificationTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'notificationTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iNotificationTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.notification ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'notificationTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'notificationTable.ts', error)
            return 'error'
        }
    }

    public async get(limit:number, offset:number, status:'read'|'unread'|'all', userID:string|number, notificationID?:string|number) {
        try {
            let statusSql = '', statusResult = [], whereSql = '', whereColumns = []
            if (status === 'read') {
                statusSql = ` AND readList LIKE ?`
                statusResult.push('%'+userID+'%')
            } else if (status === 'unread') {
                statusSql = ` AND readList NOT LIKE ?`
                statusResult.push('%'+userID+'%')
            }

            if (notificationID) {
                whereSql = ` AND id = ?`
                whereColumns.push(notificationID)
            }

            console.log(statusSql, whereSql)
            let sql = `
            SELECT notification.id, title, message, type, IF(readList LIKE ?, 'read', 'unread') AS status, mainTableID, mainTableName, user.username, person.firstName, person.otherName, 
            person.lastName, notification.createdAt AS date_time
            FROM ${this.schema}.notification 
            LEFT JOIN ${this.schema}.session ON session.id = notification.sessionID
            LEFT JOIN ${this.schema}.user ON user.id = session.userID
            LEFT JOIN ${this.schema}.employee ON employee.id = user.employeeID
            LEFT JOIN ${this.schema}.person ON person.id = employee.personID
            WHERE usersList LIKE ? ${statusSql} ${whereSql}
            LIMIT ? OFFSET ?
        `
            let result = await dbQuery(sql, ['%'+userID+'%', '%'+userID+'%', ...statusResult, ...whereColumns, limit, offset], this.database)
            console.log('sql:', sql, ['%'+userID+'%', '%'+userID+'%', ...statusResult, ...whereColumns, limit, offset])
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'notificationTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number, notificationID?:string|number) {
        try {
            let whereSql = '', whereColumns = []
            if (notificationID) {
                whereSql = ` WHERE id = ?`
                whereColumns.push(notificationID)
            }

            let result = await dbQuery(`
                SELECT id, title, message, type, usersList, readList, mainTableID, mainTableName, user.username, person.firstName, person.otherName, person.lastName
                FROM ${this.schema}.notification 
                LEFT JOIN ${this.schema}.session ON session.id = session.sessionID
                LEFT JOIN ${this.schema}.user ON user.id = session.userID
                LEFT JOIN ${this.schema}.employee ON employee.id = user.employeeID
                LEFT JOIN ${this.schema}.person ON person.id = employee.personID
                ${whereSql}
                LIMIT ? OFFSET ?
            `, [...whereColumns, limit, offset], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'notificationTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'notification',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'title', dataType: 'varchar(200)'},
                {columnName: 'message', dataType: 'text'},
                {columnName: 'type', dataType: 'varchar(100)'},
                {columnName: 'usersList', dataType: 'longtext'},
                {columnName: 'readList', dataType: 'longtext'},
                {columnName: 'mainTableID', dataType: 'BIGINT(100)'},
                {columnName: 'mainTableName', dataType: 'varchar(100)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'mainTableID', dataType: 'BIGINT(100)', addOrDrop: 'add', afterColumnName: 'readList'},
                {columnName: 'mainTableName', dataType: 'varchar(100)', addOrDrop: 'add', afterColumnName: 'mainTableID'}
            ],
            foreignKeys: [
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default NotificationTable


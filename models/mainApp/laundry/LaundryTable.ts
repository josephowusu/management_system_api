import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iDailyActivities, iDailyActivitiesUpdatableColumns } from "../../../modules/interfaces/laundry/iDailyActivities"


class DailyActivitiesTable {

    private dataObject:iDailyActivities
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iDailyActivities, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iDailyActivities) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.dailyActivities
                (id, expenseCategoryID, amount, expenseDate, receiver, description, currency, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.employeeID, this.dataObject.activityDate, 
                this.dataObject.invoice, this.dataObject.accessory, this.dataObject.quantity,
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'dailyActivitiesTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'dailyActivitiesTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iDailyActivitiesUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.dailyActivities ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'dailyActivitiesTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'dailyActivitiesTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.dailyActivities WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'dailyActivitiesTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.dailyActivities LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'dailyActivitiesTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'dailyActivities',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'employeeID', dataType: 'BIGINT(100)'},
                {columnName: 'activityDate', dataType: 'BIGINT(100)'},
                {columnName: 'invoice', dataType: 'varchar(100)'},
                {columnName: 'accessory', dataType: 'varchar(100)'},
                {columnName: 'quantity', dataType: 'longtext'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'employeeID', referenceTable: 'employee', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default DailyActivitiesTable
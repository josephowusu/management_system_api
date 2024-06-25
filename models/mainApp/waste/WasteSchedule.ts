import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iWasteScheduleTable, iWasteScheduleTableUpdatableColumns } from "../../../modules/interfaces/waste/iWasteSchedule"


class WasteScheduleTable {

    private dataObject:iWasteScheduleTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iWasteScheduleTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iWasteScheduleTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.wasteSchedule
                (id, scheduleDate, vehicleID, driverID, assistantDriver, categoryID, subCategoryID, janitorSupervisor,
                     routineStatus, invoicedSubCategory, status, sessionID, createdAt)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.scheduleDate, this.dataObject.vehicleID,
                this.dataObject.driverID, this.dataObject.assistantDriverID, this.dataObject.categoryID, 
                this.dataObject.subCategoryID, this.dataObject.janitorSupervisor, this.dataObject.routineStatus, 
                this.dataObject.invoicedSubCategory, this.dataObject.status, this.dataObject.sessionID, 
                this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'WasteScheduleTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'WasteScheduleTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iWasteScheduleTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.wasteSchedule ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'WasteScheduleTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'WasteScheduleTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.wasteSchedule WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'WasteScheduleTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.wasteSchedule LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'WasteScheduleTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'wasteSchedule',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'scheduleDate', dataType: 'BIGINT(100)'},
                {columnName: 'vehicleID', dataType: 'varchar(100)'},
                {columnName: 'driverID', dataType: 'BIGINT(100)'},
                {columnName: 'assistantDriverID', dataType: 'BIGINT(100)'},
                {columnName: 'categoryID', dataType: 'text'},
                {columnName: 'subCategoryID', dataType: 'text'},
                {columnName: 'janitorSupervisor', dataType: 'text'},
                {columnName: 'routineStatus', dataType: 'text'},
                {columnName: 'invoicedSubCategory', dataType: 'text'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'vehicleID', referenceTable: 'vehicle', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'driverID', referenceTable: 'driver', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default WasteScheduleTable
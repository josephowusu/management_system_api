import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iWastePickUpTable, iWastePickUpTableUpdatableColumns } from "../../../modules/interfaces/waste/iWastePickUp"


class WastePickUpTable {

    private dataObject:iWastePickUpTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iWastePickUpTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iWastePickUpTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.wastePickUp
                (id, wasteScheduleID, clientID, code, longitude, latitude, binSizeID, amount, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.wasteScheduleID, this.dataObject.clientID,
                this.dataObject.code, this.dataObject.longitude, this.dataObject.latitude, 
                this.dataObject.binMeasurementID, this.dataObject.amount,
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'WastePickUpTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'WastePickUpTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iWastePickUpTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.wastePickUp ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'WastePickUpTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'WastePickUpTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT wasteScheduleID.*, client.*, binMeasurementID.*, wastePickUp.*
            FROM ${this.schema}.wastePickUp 
            LEFT JOIN ${this.schema}.wasteSchedule ON person.id = wastePickUp.wasteScheduleID
            LEFT JOIN ${this.schema}.client ON client.id = wastePickUp.clientID
            LEFT JOIN ${this.schema}.binMeasurement ON binMeasurement.id = wastePickUp.binMeasurementID
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'WastePickUpTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT wasteScheduleID.*, client.*, binMeasurementID.*, wastePickUp.*
            FROM ${this.schema}.wastePickUp 
            LEFT JOIN ${this.schema}.wasteSchedule ON person.id = wastePickUp.wasteScheduleID
            LEFT JOIN ${this.schema}.client ON client.id = wastePickUp.clientID
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'WastePickUpTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'wastePickUp',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'wasteScheduleID', dataType: 'BIGINT(100)'},
                {columnName: 'clientID', dataType: 'BIGINT(100)'},
                {columnName: 'code', dataType: 'varchar(100)'},
                {columnName: 'longitude', dataType: 'varchar(100)'},
                {columnName: 'latitude', dataType: 'varchar(100)'},
                {columnName: 'binMeasurementID', dataType: 'BIGINT(100)'},
                {columnName: 'amount', dataType: 'double(20,2)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'wasteScheduleID', referenceTable: 'wasteSchedule', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'clientID', referenceTable: 'client', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'binMeasurementID', referenceTable: 'binMeasurement', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default WastePickUpTable
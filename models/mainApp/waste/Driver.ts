import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iWastePickUpTable, iWastePickUpTableUpdatableColumns } from "../../../modules/interfaces/waste/iWastePickUp"
import { iDriverTable, iDriverTableUpdatableColumns } from "../../../modules/interfaces/waste/iDriver"


class DriverTable {

    private dataObject:iDriverTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iDriverTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iDriverTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.driver
                (id, personID, licenseNumber, licenseExpiry, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.personID, this.dataObject.licenseNumber,
                this.dataObject.licenseExpiry, this.dataObject.status, this.dataObject.sessionID, 
                this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'DriverTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'DriverTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iDriverTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.driver ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'DriverTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'DriverTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT driver.*, person.*
            FROM ${this.schema}.driver 
            LEFT JOIN ${this.schema}.person ON person.id = driver.personID
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'DriverTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT driver.*, person.*
            FROM ${this.schema}.driver 
            LEFT JOIN ${this.schema}.person ON person.id = driver.personID
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'DriverTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'driver',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'personID', dataType: 'BIGINT(100)'},
                {columnName: 'licenseNumber', dataType: 'varchar(100)'},
                {columnName: 'licenseExpiry', dataType: 'datetime'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'personID', referenceTable: 'person', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default DriverTable
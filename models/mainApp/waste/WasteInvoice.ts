import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iExpenseCategoryTable, iExpenseCategoryUpdatableColumns } from "../../../modules/interfaces/miniAccount/iExpenseCategoryTable"
import { iCollectionCategoryTable, iCollectionCategoryUpdatableColumns } from "../../../modules/interfaces/miniAccount/iCollectionCategoryTable"
import { iWasteCategoryTable, iWasteCategoryTableUpdatableColumns } from "../../../modules/interfaces/waste/iWasteCategory"
import { iWasteInvoiceTable, iWasteInvoiceUpdatableColumns } from "../../../modules/interfaces/waste/iWasteInvoice"


class WasteInvoiceTable {

    private dataObject:iWasteInvoiceTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iWasteInvoiceTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iWasteInvoiceTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.wasteCategory 
                (id, clientID, date, wasteCategoryID, amount, quantity, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.clientID, this.dataObject.date,
                this.dataObject.wasteCategoryID, this.dataObject.amount, this.dataObject.quantity, 
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'WasteCategoryTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'WasteCategoryTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iWasteInvoiceUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.wasteCategory ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'WasteCategoryTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'WasteCategoryTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT client.*,  wasteCategory.*
            FROM ${this.schema}.wasteCategory 
            LEFT JOIN ${this.schema}.client ON client.id = wasteCategory.clientID
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'WasteCategoryTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT client.*,  wasteCategory.*
            FROM ${this.schema}.wasteCategory 
            LEFT JOIN ${this.schema}.client ON client.id = wasteCategory.clientID
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'WasteCategoryTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'wasteCategory',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'clientID', dataType: 'BIGINT(100)'},
                {columnName: 'date', dataType: 'varchar(100)'},
                {columnName: 'amount', dataType: 'double(20,2)'},
                {columnName: 'quantity', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'currency', dataType: 'varchar(50)', addOrDrop: 'add', afterColumnName: "dateOfTransaction"},
                {columnName: 'exchangeRate', dataType: 'DOUBLE(20,2)', addOrDrop: "add", afterColumnName:"currency"}
            ],
            foreignKeys: [
                { columnName: 'clientID', referenceTable: 'client', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default WasteInvoiceTable
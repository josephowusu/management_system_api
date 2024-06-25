import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iStockTable, iStockUpdatableColumns } from "../../../modules/interfaces/inventory/iStockTable"


class StockTable {

    private dataObject:iStockTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iStockTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iStockTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.stock
                (id, supplierID, invoiceDate, invoiceNumber, totalAmount, itemList, currency, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.supplierID, this.dataObject.invoiceDate, 
                this.dataObject.InvoiceNumber, this.dataObject.totalAmount, 
                this.dataObject.itemList, this.dataObject.currency, 
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'StockTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'StockTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iStockUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.stock ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'StockTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'StockTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.stock WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'StockTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT business.*, supplier.*, P1.*, stock.*,
            CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS supplierName 
            FROM ${this.schema}.stock 
            Left JOIN ${this.schema}.supplier AS supplier ON supplier.id = stock.supplierID
            Left JOIN ${this.schema}.person AS P1 ON P1.id = supplier.personID
            Left JOIN ${this.schema}.business ON business.id = supplier.businessID
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'StockTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'stock',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'supplierID', dataType: 'BIGINT(100)'},
                {columnName: 'invoiceDate',  dataType: 'varchar(100)'},
                {columnName: 'invoiceNumber', dataType: 'BIGINT(100)'},
                {columnName: 'totalAmount', dataType: 'BIGINT(200)'},
                {columnName: 'itemList', dataType: 'longtext'},
                {columnName: 'currency',  dataType: 'varchar(20)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                // { columnName: 'invoiceAmount', dataType: 'BIGINT(200)', addOrDrop: "drop"},
                { columnName: 'currency', dataType: 'varchar(50)', addOrDrop: "add", afterColumnName: 'itemList'},
                { columnName: 'totalAmount', dataType: 'BIGINT(200)', addOrDrop: "add", afterColumnName: 'invoiceNumber'},
                {columnName: 'exchangeRate', dataType: 'DOUBLE(20,2)', addOrDrop: "add", afterColumnName:"currency"},
            ],
            foreignKeys: [
                { columnName: 'supplierID', referenceTable: 'supplier', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default StockTable
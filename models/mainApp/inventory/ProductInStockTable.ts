import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iProductInStockTable, iProductInStockUpdatableColumns } from "../../../modules/interfaces/inventory/iProductInStock"


class ProductInStockTable {

    private dataObject:iProductInStockTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iProductInStockTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iProductInStockTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.productInStock 
                (id, stockID, productID, quantity, barCode, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.stockID, this.dataObject.productID, 
                this.dataObject.quantity, this.dataObject.barCode, this.dataObject.status, 
                this.dataObject.sessionID, this.dataObject.createdAt
            ],
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'productInStockTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'productInStockTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iProductInStockUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.productInStock ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'productInStockTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'productInStockTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.productInStock WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'productInStockTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {//Add Manufacturer
        try {
            let result = await dbQuery(`
                SELECT stock.*, product.*, productInStock.* FROM ${this.schema}.productInStock 
                LEFT JOIN ${this.schema}.stock ON stock.id = productInStock.stockID
                LEFT JOIN ${this.schema}.product ON product.id = productInStock.productID
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'productInStockTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'productInStock',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'stockID', dataType: 'BIGINT(100)'},
                {columnName: 'productID', dataType: 'BIGINT(100)'},
                {columnName: 'quantity', dataType: 'BIGINT(100)'},
                {columnName: 'barCode', dataType: 'longtext'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'stockID', dataType: 'BIGINT(100)', afterColumnName: 'id', addOrDrop: 'add'}
            ],
            foreignKeys: [
                { columnName: 'stockID', referenceTable: 'stock', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'productID', referenceTable: 'product', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}



export default ProductInStockTable
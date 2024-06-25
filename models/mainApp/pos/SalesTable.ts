import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iSalesTable, iSalesUpdatableColumns } from "../../../modules/interfaces/pos/iSalesTable"


class SalesTable {

    private dataObject:iSalesTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iSalesTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iSalesTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.sales (id, clientID, purchaseSource, deliveryAddress, deliveryCost, country, currency, tax, 
                    itemList, discount, balance, paidAmount, paymentMethod, subTotal, grandTotal, 
                    companyBankID, walkInClientName, status, sessionID, createdAt) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.clientID, this.dataObject.purchaseSource, 
                this.dataObject.deliveryAddress, this.dataObject.deliveryCost, this.dataObject.country,
                this.dataObject.currency, this.dataObject.tax, this.dataObject.itemList, 
                this.dataObject.discount, this.dataObject.balance, this.dataObject.paidAmount,
                this.dataObject.paymentMethod, this.dataObject.subTotal, this.dataObject.grandTotal, 
                this.dataObject.companyBankID, this.dataObject.walkInClientName, this.dataObject.status, this.dataObject.sessionID, 
                this.dataObject.createdAt
            ],
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'salesTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'salesTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iSalesUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.sales ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'salesTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'salesTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.sales WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'salesTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.sales LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'salesTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'sales',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'clientID', dataType: 'BIGINT(100)'},
                {columnName: 'purchaseSource', dataType: 'varchar(100)'},
                {columnName: 'deliveryAddress', dataType: 'varchar(200)'},
                {columnName: 'deliveryCost', dataType: 'DOUBLE(20,2)'},
                {columnName: 'country', dataType: 'varchar(100)'},
                {columnName: 'currency', dataType: 'varchar(20)'},
                {columnName: 'tax', dataType: 'BIGINT(10)'},
                {columnName: 'itemList', dataType: 'longtext'},
                {columnName: 'discount', dataType: 'varchar(100)'},
                {columnName: 'balance', dataType: 'DOUBLE(20,2)'},
                {columnName: 'paidAmount', dataType: 'DOUBLE(20,2)'},
                {columnName: 'paymentMethod', dataType: 'varchar(50)'},
                {columnName: 'subTotal', dataType: 'DOUBLE(20,2)'},
                {columnName: 'grandTotal', dataType: 'DOUBLE(20,2)'},
                {columnName: 'companyBankID', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'walkInClientName', dataType: 'varchar(100)', addOrDrop: 'add', afterColumnName: 'companyBankID'},
            ],
            foreignKeys: [
                { columnName: 'clientID', referenceTable: 'client', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'companyBankID', referenceTable: 'companyBank', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default SalesTable
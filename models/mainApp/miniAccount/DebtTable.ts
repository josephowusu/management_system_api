import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iDebtTable, iDebtTableUpdatableColumns } from "../../../modules/interfaces/miniAccount/iDebtTable"


class DebtTable {

    private dataObject:iDebtTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iDebtTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iDebtTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.debt 
                (id, supplierID, debtCategoryID, invoiceNumber, amount, dateOfTransaction, currency, dueDate, transactionDescription, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.supplierID, this.dataObject.debtCategoryID, 
                this.dataObject.invoiceNumber, this.dataObject.amount, this.dataObject.dateOfTransaction, 
                this.dataObject.currency, this.dataObject.dueDate, this.dataObject.transactionDescription, 
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'debtTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'debtTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iDebtTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.debt ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'debtTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'debtTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT debt.*, supplier.*, debtCategory.* FROM ${this.schema}.debt 
            LEFT JOIN ${this.schema}.supplier ON supplier.id = debt.supplierID
            LEFT JOIN ${this.schema}.debtCategory ON debtCategory.id = debt.debtCategoryID
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'debtTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT person.*, supplier.*, debtCategory.*, debt.*
            FROM ${this.schema}.debt 
            LEFT JOIN ${this.schema}.supplier ON supplier.id = debt.supplierID
            LEFT JOIN ${this.schema}.debtCategory ON debtCategory.id = debt.debtCategoryID
            Left JOIN ${this.schema}.person ON person.id = supplier.personID
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'debtTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'debt',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'supplierID', dataType: 'BIGINT(100)'},
                {columnName: 'debtCategoryID', dataType: 'BIGINT(100)'},
                {columnName: 'invoiceNumber', dataType: 'varchar(200)'},
                {columnName: 'amount', dataType: 'double(20, 2)'},
                {columnName: 'dateOfTransaction', dataType: 'varchar(50)'},
                {columnName: 'dueDate', dataType: 'varchar(50)'},
                {columnName: 'transactionDescription', dataType: 'text'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'currency', dataType: 'varchar(50)', addOrDrop: 'add', afterColumnName: "dateOfTransaction"},
                {columnName: 'exchangeRate', dataType: 'DOUBLE(20,2)', addOrDrop: "add", afterColumnName:"currency"}
            ],
            foreignKeys: [
                { columnName: 'supplierID', referenceTable: 'supplier', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'debtCategoryID', referenceTable: 'debtCategory', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default DebtTable
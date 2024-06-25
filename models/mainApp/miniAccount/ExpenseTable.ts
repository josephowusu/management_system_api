import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iExpenseTable, iExpenseTableUpdatableColumns } from "../../../modules/interfaces/miniAccount/iExpenseTable"


class ExpenseTable {

    private dataObject:iExpenseTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iExpenseTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iExpenseTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.expense
                (id, expenseCategoryID, amount, expenseDate, receiver, description, currency, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.expenseCategoryID, this.dataObject.amount, 
                this.dataObject.expenseDate, this.dataObject.receiver, this.dataObject.description,
                this.dataObject.currency, this.dataObject.status, this.dataObject.sessionID, 
                this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'expenseTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'expenseTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iExpenseTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.expense ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'expenseTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'expenseTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT expenseCategory.*, expense.* 
            FROM ${this.schema}.expense 
            LEFT JOIN ${this.schema}.expenseCategory ON expenseCategory.id = expense.expenseCategoryID
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'expenseTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT expenseCategory.*, expense.* 
            FROM ${this.schema}.expense 
            LEFT JOIN ${this.schema}.expenseCategory ON expenseCategory.id = expense.expenseCategoryID
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'expenseTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'expense',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'expenseCategoryID', dataType: 'BIGINT(100)'},
                {columnName: 'amount', dataType: 'BIGINT(100)'},
                {columnName: 'expenseDate', dataType: 'varchar(100)'},
                {columnName: 'receiver', dataType: 'varchar(100)'},
                {columnName: 'description', dataType: 'longtext'},
                {columnName: 'currency', dataType: 'varchar(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'exchangeRate', dataType: 'DOUBLE(20,2)', addOrDrop: "add", afterColumnName:"currency"}
            ],
            foreignKeys: [
                { columnName: 'expenseCategoryID', referenceTable: 'expenseCategory', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default ExpenseTable
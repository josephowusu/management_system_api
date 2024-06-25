import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iCompanyBankTable, iCompanyBankTableUpdatableColumns } from "../../../modules/interfaces/default/iCompanyBankTable"


class CompanyBankTable {

    private dataObject:iCompanyBankTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iCompanyBankTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iCompanyBankTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.companyBank
                (id, bankID, accountNumber, accountName, type, balance, sessionID, status, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.bankID, this.dataObject.accountNumber, 
                this.dataObject.accountName, this.dataObject.type, this.dataObject.balance, 
                this.dataObject.sessionID,this.dataObject.status, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'CompanyBankTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'CompanyBankTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iCompanyBankTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.companyBank ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'CompanyBankTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'CompanyBankTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.companyBank WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'CompanyBankTable.ts', error)
            return []
        }
    }


    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT bk.*, companyBank.* FROM ${this.schema}.companyBank 
                LEFT JOIN ${this.schema}.bank as bk ON bk.id = companyBank.bankID
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'CompanyBankTable.ts', error)
            return []
        }
    }
    

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'companyBank',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'bankID', dataType: 'BIGINT(100)'},
                {columnName: 'accountNumber', dataType: 'varchar(200)'},
                {columnName: 'accountName', dataType: 'varchar(100)'},
                {columnName: 'balance', dataType: 'BIGINT(100)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                { columnName: 'type', dataType: 'varchar(50)', addOrDrop: "add", afterColumnName: "accountName"},
                { columnName: 'balance', dataType: 'BIGINT(100)', addOrDrop: "add", afterColumnName: "accountName"}
            ],
            foreignKeys: [
                { columnName: 'bankID', referenceTable: 'bank', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default CompanyBankTable
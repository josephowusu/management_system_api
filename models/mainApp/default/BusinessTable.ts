import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iBusinessData } from "../../../modules/interfaces/default/iBusinessTable"
import { iBusinessUpdatableColumns } from "../../../modules/interfaces/default/iBusinessTable"


class BusinessTable {

    private dataObject:iBusinessData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iBusinessData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iBusinessData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.business 
                (id, uniqueCode, name, taxIdentificationNumber, smsDisplayName, contactID, addressID, status, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.uniqueCode, this.dataObject.name, 
                this.dataObject.taxIdentificationNumber, this.dataObject.smsDisplayName,
                this.dataObject.contactID, this.dataObject.addressID, 
                this.dataObject.status, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'BusinessTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iBusinessUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.business ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'BusinessTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT contact.*, address.*, business.* FROM ${this.schema}.business 
                LEFT JOIN ${this.schema}.contact ON contact.id = business.contactID
                LEFT JOIN ${this.schema}.address ON address.id = business.addressID
                WHERE ${search} LIMIT ${limit} OFFSET ${offset}
            `, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'BusinessTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT contact.*, address.*, business.* FROM ${this.schema}.business 
                LEFT JOIN ${this.schema}.contact ON contact.id = business.contactID
                LEFT JOIN ${this.schema}.address ON address.id = business.addressID
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'BusinessTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'business',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'uniqueCode', dataType: 'varchar(20)'},
                {columnName: 'name', dataType: 'text'},
                {columnName: 'taxIdentificationNumber', dataType: 'varchar(20)'},
                {columnName: 'smsDisplayName', dataType: 'varchar(20)'},
                {columnName: 'contactID', dataType: 'BIGINT(100)'},
                {columnName: 'addressID', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'contactID', referenceTable: 'contact', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'addressID', referenceTable: 'address', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default BusinessTable
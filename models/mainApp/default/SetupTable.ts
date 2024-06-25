import MySQL from "mysql"
import { iSetupData, iSetupUpdatableColumns } from "../../../modules/interfaces/default/iSetupTable"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"


class SetupTable {

    private dataObject:iSetupData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iSetupData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iSetupData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    private ifEmpty() {
        return (this.dataObject.id && this.dataObject.businessID && this.dataObject.theme && this.dataObject.currency)
    }

    private async ifExist() {
        let result = await dbQuery(`
            SELECT * FROM ${this.schema}.setup WHERE businessID = ? AND status = ?
        `, [this.dataObject.businessID, 'active'], this.database)
        return Array.isArray(result) && result.length > 0 ? true : false
    }

    public async save() {
        try {
            if (this.ifEmpty()) {
                if (await this.ifExist()) {
                    return {type: 'exist'}
                } else {
                    this.dataObject.createdAt = fullDateTime()
                    let result:any = await dbQuery(`
                        INSERT INTO ${this.schema}.setup 
                        (id, businessID, logo, theme, currency, status, createdAt) 
                        VALUES (?,?,?,?,?,?,?)
                    `, [
                        this.dataObject.id, this.dataObject.businessID, this.dataObject.logo, 
                        this.dataObject.theme, this.dataObject.currency, this.dataObject.status, this.dataObject.createdAt
                    ], 
                    this.database)
                    if (result && result.affectedRows) {
                        return {type: 'success', primaryKey: this.dataObject.id}
                    } else {
                        Logger.log('error', 'SetupTable.ts', JSON.stringify(result))
                        return {type: 'error'}
                    }
                }
            } else {
                return {type: 'empty'}
            }
        } catch (error:any) {
            Logger.log('error', 'SetupTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iSetupUpdatableColumns[]) {
        try {
            if (this.ifEmpty()) {
                const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
                let sql = `UPDATE ${this.schema}.setup ${sqlStatement.sql} WHERE id = ? AND status = ?`
                let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
                let result:any = await dbQuery(sql, columns, this.database)
                if (result && result.affectedRows) {
                    return 'success'
                } else {
                    Logger.log('error', 'SetupTable.ts', JSON.stringify(result))
                    return 'error'
                }
            } else {
                return 'empty'
            }
        } catch (error:any) {
            Logger.log('error', 'SetupTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT contact.*, address.*, business.*, setup.* FROM ${this.schema}.setup
                LEFT JOIN ${this.schema}.business ON business.id = setup.businessID 
                LEFT JOIN ${this.schema}.contact ON contact.id = business.contactID
                LEFT JOIN ${this.schema}.address ON address.id = business.addressID
                WHERE ${search} LIMIT ${limit} OFFSET ${offset}
            `, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SetupTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT contact.*, address.*, business.*, setup.* FROM ${this.schema}.setup
                LEFT JOIN ${this.schema}.business ON business.id = setup.businessID 
                LEFT JOIN ${this.schema}.contact ON contact.id = business.contactID
                LEFT JOIN ${this.schema}.address ON address.id = business.addressID 
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SetupTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'setup',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'businessID', dataType: 'BIGINT(100)'},
                {columnName: 'theme', dataType: 'text'},
                {columnName: 'currency', dataType: 'varchar(20)'},
                {columnName: 'logo', dataType: 'text'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'businessID', referenceTable: 'business', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default SetupTable
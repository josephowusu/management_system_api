import { dbQuery, fullDateTime, generateID, generateStringID, getUpdateSqlStatement } from "../../modules/GeneralModules"
import Logger from "../../modules/Logger"
import { iBusinessData, iBusinessTable, iBusinessUpdatableColumns } from "../../modules/interfaces/core/iBusinessTable"
import { iGetCreateTableDetails } from "../../modules/interfaces/iMigration"
import MySQL from 'mysql'

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

    private ifEmpty() {
        return (this.dataObject.id && this.dataObject.name && this.dataObject.phone && this.dataObject.email)
    }

    private async ifExist() {
        let result = await dbQuery(`
            SELECT * FROM ${this.schema}.business WHERE name = ? AND id != ? AND status = ?
        `, [this.dataObject.name ? this.dataObject.name : null, this.dataObject.id, 'active'], this.database)
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
                        INSERT INTO ${this.schema}.business 
                        (id, uniqueCode, name, phone, email, location, postalAddress, country, stateOrRegion, cityOrTown, status, createdAt) 
                        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                    `, [
                        this.dataObject.id, this.dataObject.uniqueCode, this.dataObject.name, this.dataObject.phone, this.dataObject.email, this.dataObject.location,
                        this.dataObject.address, this.dataObject.country, this.dataObject.stateOrRegion, this.dataObject.cityOrTown,
                        this.dataObject.status, this.dataObject.createdAt
                    ], 
                    this.database)
                    if (result && result.affectedRows) {
                        return {type: 'success', primaryKey: this.dataObject.id}
                    } else {
                        Logger.log('error', 'BusinessTable.ts', JSON.stringify(result))
                        return {type: 'error'}
                    }
                }
            } else {
                return {type: 'empty'}
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iBusinessUpdatableColumns[]) {
        try {
            if (this.ifEmpty()) {
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
            } else {
                return 'empty'
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result
            if (limit) {
                values.push(limit)
                values.push(offset)
                result = await dbQuery(`
                    SELECT * FROM ${this.schema}.business WHERE ${search} LIMIT ? OFFSET ?
                `, values, this.database)
            } else {
                result = await dbQuery(`
                    SELECT * FROM ${this.schema}.business WHERE ${search}
                `, values, this.database)
            }
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'BusinessTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result
            if (limit) {
                result = await dbQuery(`SELECT * FROM ${this.schema}.business LIMIT ? OFFSET ?`, [limit, offset], this.database)
            } else {
                result = await dbQuery(`SELECT * FROM ${this.schema}.business`, [], this.database)
            }
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
                {columnName: 'uniqueCode', dataType: 'varchar(15)'},
                {columnName: 'name', dataType: 'varchar(255)'},
                {columnName: 'location', dataType: 'varchar(255)'},
                {columnName: 'postalAddress', dataType: 'varchar(255)'},
                {columnName: 'email', dataType: 'varchar(255)'},
                {columnName: 'phone', dataType: 'varchar(20)'},
                {columnName: 'country', dataType: 'varchar(255)'},
                {columnName: 'stateOrRegion', dataType: 'varchar(255)'},
                {columnName: 'cityOrTown', dataType: 'varchar(255)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                // {columnName: 'status', dataType: 'varchar(50)', afterColumnName: 'cityOrTown', addOrDrop: 'add'},
                // {columnName: 'createdAt', dataType: 'datetime', afterColumnName: 'status', addOrDrop: 'add'}
            ],
            foreignKeys: [
                // {columnName: '', keyName: '', referenceTable: '', addOrDrop: 'add'|'drop'}
            ]
        }
    }
}

export default BusinessTable

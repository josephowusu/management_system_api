import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../modules/GeneralModules"
import Logger from "../../modules/Logger"
import MySQL from "mysql"
import { iGetCreateTableDetails } from "../../modules/interfaces/iMigration"
import { iBusinessDatabaseData, iBusinessDatabaseUpdatableColumns } from "../../modules/interfaces/core/iBusinessDatabaseTable"


class BusinessDatabaseTable {

    private dataObject:iBusinessDatabaseData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iBusinessDatabaseData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iBusinessDatabaseData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    private ifEmpty() {
        return (this.dataObject.id && this.dataObject.businessID && this.dataObject.schemaName)
    }

    private async ifExist() {
        let result = await dbQuery(`
            SELECT * FROM ${this.schema}.businessDatabase WHERE schemaName = ? AND status = ?
        `, [this.dataObject.schemaName ? this.dataObject.schemaName : null, 'active'], this.database)
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
                        INSERT INTO ${this.schema}.businessDatabase 
                        (id, businessID, schemaName, status, createdAt) 
                        VALUES (?,?,?,?,?)
                    `, [
                        this.dataObject.id, this.dataObject.businessID, this.dataObject.schemaName, this.dataObject.status, 
                        this.dataObject.createdAt
                    ], 
                    this.database)
                    if (result && result.affectedRows) {
                        return {type: 'success', primaryKey: this.dataObject.id}
                    } else {
                        Logger.log('error', 'BusinessDatabaseTable.ts', JSON.stringify(result))
                        return {type: 'error'}
                    }
                }
            } else {
                return {type: 'empty'}
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessDatabaseTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iBusinessDatabaseUpdatableColumns[]) {
        try {
            if (this.ifEmpty()) {
                const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
                let sql = `UPDATE ${this.schema}.businessDatabase ${sqlStatement.sql} WHERE id = ? AND status = ?`
                let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
                let result:any = await dbQuery(sql, columns, this.database)
                if (result && result.affectedRows) {
                    return 'success'
                } else {
                    Logger.log('error', 'BusinessDatabaseTable.ts', JSON.stringify(result))
                    return 'error'
                }
            } else {
                return 'empty'
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessDatabaseTable.ts', error)
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
                    SELECT ${this.schema}.business.*, ${this.schema}.businessDatabase.* 
                    FROM ${this.schema}.businessDatabase 
                    LEFT JOIN ${this.schema}.business ON business.id = businessDatabase.businessID
                    WHERE ${search} LIMIT ? OFFSET ?
                `, values, this.database)
            } else {
                result = await dbQuery(`
                    SELECT ${this.schema}.business.*, ${this.schema}.businessDatabase.* 
                    FROM ${this.schema}.businessDatabase 
                    LEFT JOIN ${this.schema}.business ON business.id = businessDatabase.businessID
                    WHERE ${search}
                `, values, this.database)
            }
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'BusinessDatabaseTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result
            if (limit) {
                result = await dbQuery(`
                    SELECT ${this.schema}.business.*, ${this.schema}.businessDatabase.* 
                    FROM ${this.schema}.businessDatabase 
                    LEFT JOIN ${this.schema}.business ON business.id = businessDatabase.businessID
                    LIMIT ? OFFSET ?
                `, [limit, offset], this.database)
            } else {
                result = await dbQuery(`
                    SELECT ${this.schema}.business.*, ${this.schema}.businessDatabase.* 
                    FROM ${this.schema}.businessDatabase 
                    LEFT JOIN ${this.schema}.business ON business.id = businessDatabase.businessID
                `, [], this.database)
            }
            // console.log(result)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'BusinessDatabaseTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'businessDatabase',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'businessID', dataType: 'BIGINT(100)'},
                {columnName: 'schemaName', dataType: 'varchar(255)'},
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

export default BusinessDatabaseTable
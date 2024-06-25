import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../modules/GeneralModules"
import Logger from "../../modules/Logger"
import { iBusinessOwnerData, iBusinessOwnerUpdatableColumns } from "../../modules/interfaces/core/iBusinessOwnerTable"
import MySQL from "mysql"
import { iGetCreateTableDetails } from "../../modules/interfaces/iMigration"


class BusinessOwnerTable {

    private dataObject:iBusinessOwnerData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iBusinessOwnerData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iBusinessOwnerData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    private ifEmpty() {
        return (this.dataObject.id && this.dataObject.businessID && this.dataObject.firstName && this.dataObject.lastName)
    }

    private async ifExist() {
        let result = await dbQuery(`
            SELECT * FROM ${this.schema}.businessOwner WHERE firstName = ? AND otherName = ? AND lastName = ? AND businessID = ? AND status = ?
        `, [
            this.dataObject.firstName ? this.dataObject.firstName : null,
            this.dataObject.otherName ? this.dataObject.otherName : null, 
            this.dataObject.lastName ? this.dataObject.lastName : null,
            this.dataObject.businessID, 'active'
        ], this.database)
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
                        INSERT INTO ${this.schema}.businessOwner 
                        (id, businessID, firstName, otherName, lastName, status, createdAt) 
                        VALUES (?,?,?,?,?,?,?)
                    `, [
                        this.dataObject.id, this.dataObject.businessID, this.dataObject.firstName, 
                        this.dataObject.otherName, this.dataObject.lastName, this.dataObject.status, 
                        this.dataObject.createdAt
                    ], 
                    this.database)
                    if (result && result.affectedRows) {
                        return {type: 'success', primaryKey: this.dataObject.id}
                    } else {
                        Logger.log('error', 'BusinessOwnerTable.ts', JSON.stringify(result))
                        return {type: 'error'}
                    }
                }
            } else {
                return {type: 'empty'}
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessOwnerTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iBusinessOwnerUpdatableColumns[]) {
        try {
            if (this.ifEmpty()) {
                const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
                let sql = `UPDATE ${this.schema}.businessOwner ${sqlStatement.sql} WHERE id = ? AND status = ?`
                let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
                let result:any = await dbQuery(sql, columns, this.database)
                if (result && result.affectedRows) {
                    return 'success'
                } else {
                    Logger.log('error', 'BusinessOwnerTable.ts', JSON.stringify(result))
                    return 'error'
                }
            } else {
                return 'empty'
            }
        } catch (error:any) {
            Logger.log('error', 'BusinessOwnerTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.businessOwner WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'BusinessOwnerTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.businessOwner LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'BusinessOwnerTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'businessOwner',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'businessID', dataType: 'BIGINT(100)'},
                {columnName: 'firstName', dataType: 'varchar(255)'},
                {columnName: 'otherName', dataType: 'varchar(255)'},
                {columnName: 'lastName', dataType: 'varchar(255)'},
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

export default BusinessOwnerTable
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../modules/GeneralModules"
import Logger from "../../modules/Logger"
import MySQL from "mysql"
import { iGetCreateTableDetails } from "../../modules/interfaces/iMigration"
import { iSoftwarePackageData, iSoftwarePackageDataUpdatableColumns } from "../../modules/interfaces/core/iSoftwarePackage"


class SoftwarePackageTable {

    private dataObject:iSoftwarePackageData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iSoftwarePackageData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iSoftwarePackageData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    private ifEmpty() {
        return (this.dataObject.id && this.dataObject.name)
    }

    private async ifExist() {
        let result = await dbQuery(`
            SELECT * FROM ${this.schema}.softwarePackage WHERE name = ? AND status = ?
        `, [this.dataObject.name ? this.dataObject.name : null, 'active'], this.database)
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
                        INSERT INTO ${this.schema}.softwarePackage 
                        (id, name, price, uom, description, details, images, status, createdAt) 
                        VALUES (?,?,?,?,?,?,?,?,?)
                    `, [
                        this.dataObject.id, this.dataObject.name, this.dataObject.price, this.dataObject.uom, 
                        this.dataObject.description, this.dataObject.details, this.dataObject.images, this.dataObject.status, 
                        this.dataObject.createdAt
                    ], 
                    this.database)
                    if (result && result.affectedRows) {
                        return {type: 'success', primaryKey: this.dataObject.id}
                    } else {
                        Logger.log('error', 'SoftwarePackageTable.ts', JSON.stringify(result))
                        return {type: 'error'}
                    }
                }
            } else {
                return {type: 'empty'}
            }
        } catch (error:any) {
            Logger.log('error', 'SoftwarePackageTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iSoftwarePackageDataUpdatableColumns[]) {
        try {
            if (this.ifEmpty()) {
                const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
                let sql = `UPDATE ${this.schema}.softwarePackage ${sqlStatement.sql} WHERE id = ? AND status = ?`
                let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
                let result:any = await dbQuery(sql, columns, this.database)
                if (result && result.affectedRows) {
                    return 'success'
                } else {
                    Logger.log('error', 'SoftwarePackageTable.ts', JSON.stringify(result))
                    return 'error'
                }
            } else {
                return 'empty'
            }
        } catch (error:any) {
            Logger.log('error', 'SoftwarePackageTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT * FROM ${this.schema}.softwarePackage 
                WHERE ${search} LIMIT ${limit} OFFSET ${offset}
            `, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SoftwarePackageTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.softwarePackage LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SoftwarePackageTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'softwarePackage',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'icon', dataType: 'longtext'},
                {columnName: 'name', dataType: 'varchar(255)'},
                {columnName: 'price', dataType: 'varchar(255)'},
                {columnName: 'uom', dataType: 'varchar(50)'},
                {columnName: 'description', dataType: 'longtext'},
                {columnName: 'details', dataType: 'longtext'},
                {columnName: 'images', dataType: 'longtext'},
                {columnName: 'features', dataType: 'longtext'},
                {columnName: 'featureTables', dataType: 'longtext'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'icon', dataType: 'longtext', afterColumnName: 'id', addOrDrop: 'add'},
                {columnName: 'details', dataType: 'longtext', afterColumnName: 'description', addOrDrop: 'add'}
            ],
            foreignKeys: []
        }
    }
}

export default SoftwarePackageTable

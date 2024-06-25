import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iExpenseCategoryTable, iExpenseCategoryUpdatableColumns } from "../../../modules/interfaces/miniAccount/iExpenseCategoryTable"
import { iCollectionCategoryTable, iCollectionCategoryUpdatableColumns } from "../../../modules/interfaces/miniAccount/iCollectionCategoryTable"


class CollectionCategoryTable {

    private dataObject:iCollectionCategoryTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iCollectionCategoryTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iCollectionCategoryTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.collectionCategory 
                (id, categoryName, dependency, color, description, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.categoryName, this.dataObject.dependency, 
                this.dataObject.color, this.dataObject.description, this.dataObject.status,this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'CollectionCategoryTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'CollectionCategoryTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iCollectionCategoryUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.collectionCategory ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'CollectionCategoryTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'CollectionCategoryTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.collectionCategory WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'CollectionCategoryTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.collectionCategory LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'CollectionCategoryTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'collectionCategory',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'categoryName', dataType: 'varchar(200)'},
                {columnName: 'dependency', dataType: 'BIGINT(100)'},
                {columnName: 'color', dataType: 'varchar(20)'},
                {columnName: 'description', dataType: 'text'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default CollectionCategoryTable
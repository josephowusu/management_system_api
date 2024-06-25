import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iCollectionPointTable, iCollectionPointUpdatableColumns } from "../../../modules/interfaces/laundry/iCollectionPointTable"


class CollectionPointTable {

    private dataObject:iCollectionPointTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iCollectionPointTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iCollectionPointTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.collectionPoint
                (id, collectionPoint, phone, contactPersonID, contactPersonContactID, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.collectionPoint, this.dataObject.phone, 
                this.dataObject.contactPersonID, this.dataObject.contactPersonContactID, this.dataObject.status,
                this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'collectionPointTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'collectionPointTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iCollectionPointUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.collectionPoint ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'collectionPointTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'collectionPointTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.collectionPoint WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'collectionPointTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.collectionPoint LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'collectionPointTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'collectionPoint',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'collectionPoint', dataType: 'varchar(100)'},
                {columnName: 'phone', dataType: 'varchar(100)'},
                {columnName: 'contactPersonID', dataType: 'BIGINT(100)'},
                {columnName: 'contactPersonContactID', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'contactPersonID', referenceTable: 'person', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'contactPersonContactID', referenceTable: 'contact', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default CollectionPointTable
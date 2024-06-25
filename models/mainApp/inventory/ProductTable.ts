import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iProductTable, iProductUpdatableColumns } from "../../../modules/interfaces/inventory/iProductTable"


class ProductTable {

    private dataObject:iProductTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iProductTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iProductTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.product 
                (id, images, name, type, productCategoryID, manufacturerID, UOMAndPrice, productDescription, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.images, this.dataObject.name, this.dataObject.type,
                this.dataObject.productCategoryID, this.dataObject.manufacturerID, 
                this.dataObject.UOMAndPrice, this.dataObject.productDescription,
                 this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ],
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'productTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'productTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iProductUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.product ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'productTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'productTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.product WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'productTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {//Add Manufacturer
        try {
            let result = await dbQuery(`
                SELECT productCategory.*, product.* FROM ${this.schema}.product 
                LEFT JOIN ${this.schema}.productCategory ON productCategory.id = product.productCategoryID
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'ProductTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'product',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'name', dataType: 'varchar(100)'},
                {columnName: 'images', dataType: 'longtext'},
                {columnName: 'type', dataType: 'varchar(100)'},
                {columnName: 'productCategoryID', dataType: 'BIGINT(100)'},
                {columnName: 'manufacturerID', dataType: 'BIGINT(100)'},
                {columnName: 'UOMAndPrice', dataType: 'longtext'},
                {columnName: 'productDescription', dataType: 'longtext'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'productCategoryID', referenceTable: 'productCategory', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default ProductTable
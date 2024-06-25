import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iAddressData, iAddressUpdatableColumns } from "../../../modules/interfaces/default/iAddressTable"


class AddressTable {

    private dataObject:iAddressData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iAddressData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iAddressData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.address 
                (id, postalAddress, digitalAddress, location, landMark, geoLatitude, geoLongitude, country, stateOrRegion, cityOrTown, suburb, status, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.postalAddress, this.dataObject.digitalAddress, 
                this.dataObject.location, this.dataObject.landMark, this.dataObject.geoLatitude,
                this.dataObject.geoLongitude, this.dataObject.country, this.dataObject.stateOrRegion, 
                this.dataObject.cityOrTown, this.dataObject.suburb,  
                this.dataObject.status, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'AddressTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'AddressTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iAddressUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.address ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'AddressTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'AddressTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.address WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'AddressTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.address LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'AddressTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'address',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'postalAddress', dataType: 'text'},
                {columnName: 'digitalAddress', dataType: 'text'},
                {columnName: 'location', dataType: 'text'},
                {columnName: 'landMark', dataType: 'text'},
                {columnName: 'geoLatitude', dataType: 'double(10,6)'},
                {columnName: 'geoLongitude', dataType: 'double(10,6)'},
                {columnName: 'country', dataType: 'varchar(255)'},
                {columnName: 'stateOrRegion', dataType: 'varchar(255)'},
                {columnName: 'cityOrTown', dataType: 'varchar(255)'},
                {columnName: 'suburb', dataType: 'varchar(255)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: []
        }
    }
}

export default AddressTable
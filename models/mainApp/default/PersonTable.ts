import MySQL from "mysql"
import { iPersonData, iPersonUpdatableColumns } from "../../../modules/interfaces/default/iPersonTable"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"


class PersonTable {

    private dataObject:iPersonData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iPersonData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iPersonData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    private ifEmpty() {
        return (this.dataObject.id && this.dataObject.firstName && this.dataObject.lastName && this.dataObject.gender)
    }

    public async save() {
        try {
            if (this.ifEmpty()) {
                this.dataObject.createdAt = fullDateTime()
                let result:any = await dbQuery(`
                    INSERT INTO ${this.schema}.person 
                    (id, firstName, otherName, lastName, gender, dateOfBirth, maritalStatus, placeOfBirth, nationality, nationalIdNumber, socialSecurityNumber, status, createdAt) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                    this.dataObject.id, this.dataObject.firstName, this.dataObject.otherName, 
                    this.dataObject.lastName, this.dataObject.gender, this.dataObject.dateOfBirth,
                    this.dataObject.maritalStatus, this.dataObject.placeOfBirth, this.dataObject.nationality,
                    this.dataObject.nationalIdNumber, this.dataObject.socialSecurityNumber,
                    this.dataObject.status, this.dataObject.createdAt
                ], 
                this.database)
                if (result && result.affectedRows) {
                    return {type: 'success', primaryKey: this.dataObject.id}
                } else {
                    Logger.log('error', 'PersonTable.ts', JSON.stringify(result))
                    return {type: 'error'}
                }
            } else {
                return {type: 'empty'}
            }
        } catch (error:any) {
            Logger.log('error', 'PersonTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iPersonUpdatableColumns[]) {
        try {
            if (this.ifEmpty()) {
                const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
                let sql = `UPDATE ${this.schema}.person ${sqlStatement.sql} WHERE id = ? AND status = ?`
                let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
                let result:any = await dbQuery(sql, columns, this.database)
                if (result && result.affectedRows) {
                    return 'success'
                } else {
                    Logger.log('error', 'PersonTable.ts', JSON.stringify(result))
                    return 'error'
                }
            } else {
                return 'empty'
            }
        } catch (error:any) {
            Logger.log('error', 'PersonTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.person WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'PersonTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.person LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'PersonTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'person',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'firstName', dataType: 'varchar(255)'},
                {columnName: 'otherName', dataType: 'varchar(255)'},
                {columnName: 'lastName', dataType: 'varchar(255)'},
                {columnName: 'gender', dataType: 'varchar(10)'},
                {columnName: 'dateOfBirth', dataType: 'varchar(20)'},
                {columnName: 'maritalStatus', dataType: 'varchar(20)'},
                {columnName: 'placeOfBirth', dataType: 'varchar(255)'},
                {columnName: 'nationality', dataType: 'varchar(255)'},
                {columnName: 'nationalIdNumber', dataType: 'varchar(20)'},
                {columnName: 'socialSecurityNumber', dataType: 'varchar(20)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: []
        }
    }
}

export default PersonTable
import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iUserData, iUserUpdatableColumns } from "../../../modules/interfaces/default/iUserTable"


class UserTable {

    private dataObject:iUserData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iUserData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iUserData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.user 
                (id, employeeID, username, password, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.employeeID, this.dataObject.username, 
                this.dataObject.password, this.dataObject.status,
                this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'UserTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'UserTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iUserUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.user ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'UserTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'UserTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT employeeBank.*,  department.*, contact.*, address.*, person.*, employee.*, user.* FROM ${this.schema}.user 
                LEFT JOIN ${this.schema}.employee ON employee.id = user.employeeID
                LEFT JOIN ${this.schema}.person ON person.id = employee.personID
                LEFT JOIN ${this.schema}.contact ON contact.id = employee.contactID
                LEFT JOIN ${this.schema}.address ON address.id = employee.addressID
                LEFT JOIN ${this.schema}.employeeBank ON employeeBank.id = employee.employeeBankID 
                LEFT JOIN ${this.schema}.department ON department.id = employee.departmentID 
                WHERE ${search} LIMIT ${limit} OFFSET ${offset}
            `, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'UserTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT employeeBank.*, department.*, contact.*, address.*, person.*, employee.*, user.* FROM ${this.schema}.user 
                LEFT JOIN ${this.schema}.employee ON employee.id = user.employeeID
                LEFT JOIN ${this.schema}.person ON person.id = employee.personID
                LEFT JOIN ${this.schema}.contact ON contact.id = employee.contactID
                LEFT JOIN ${this.schema}.address ON address.id = employee.addressID
                LEFT JOIN ${this.schema}.employeeBank ON employeeBank.id = employee.employeeBankID 
                LEFT JOIN ${this.schema}.department ON department.id = employee.departmentID 
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'UserTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'user',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'employeeID', dataType: 'BIGINT(100)'},
                {columnName: 'username', dataType: 'varchar(255)'},
                {columnName: 'password', dataType: 'text'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'employeeID', referenceTable: 'employee', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default UserTable


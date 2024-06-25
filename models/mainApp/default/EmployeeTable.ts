import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iEmployeeData, iEmployeeUpdatableColumns } from "../../../modules/interfaces/default/iEmployeeTable"


class EmployeeTable {

    private dataObject:iEmployeeData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iEmployeeData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iEmployeeData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.employee 
                (id, personID, contactID, addressID, departmentID, role, employeeBankID, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.personID, this.dataObject.contactID, this.dataObject.addressID, 
                this.dataObject.departmentID, this.dataObject.role, this.dataObject.employeeBankID,
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'EmployeeTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'EmployeeTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iEmployeeUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.employee ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'EmployeeTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'EmployeeTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT contact.*, P1.*, address.*, employeeBank.*, bank.*, bank.name AS bankName, employee.*, CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS employeeName
                FROM ${this.schema}.employee
                LEFT JOIN ${this.schema}.person AS P1 ON P1.id = employee.personID
                LEFT JOIN ${this.schema}.contact ON contact.id = employee.contactID
                LEFT JOIN ${this.schema}.address ON address.id = employee.addressID
                LEFT JOIN ${this.schema}.employeeBank ON employeeBank.id = employee.employeeBankID
                LEFT JOIN ${this.schema}.bank AS bank ON bank.id = employeeBank.bankID
                WHERE ${search} LIMIT ${limit} OFFSET ${offset}
            `, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'EmployeeTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT contact.*, P1.*, address.*, employeeBank.*, bank.*, bank.name AS bankName, employee.*, CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS employeeName
                FROM ${this.schema}.employee
                LEFT JOIN ${this.schema}.person AS P1 ON P1.id = employee.personID
                LEFT JOIN ${this.schema}.contact ON contact.id = employee.contactID
                LEFT JOIN ${this.schema}.address ON address.id = employee.addressID
                LEFT JOIN ${this.schema}.employeeBank ON employeeBank.id = employee.employeeBankID
                LEFT JOIN ${this.schema}.bank AS bank ON bank.id = employeeBank.bankID
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'EmployeeTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'employee',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'personID', dataType: 'BIGINT(100)'},
                {columnName: 'contactID', dataType: 'BIGINT(100)'},
                {columnName: 'addressID', dataType: 'BIGINT(100)'},
                {columnName: 'departmentID', dataType: 'BIGINT(100)'},
                {columnName: 'role', dataType: 'varchar(200)'},
                {columnName: 'employeeBankID', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'role', dataType: 'varchar(200)', afterColumnName: 'departmentID', addOrDrop: 'add'},
                {columnName: 'employeeBankID', dataType: 'BIGINT(100)', afterColumnName: 'role', addOrDrop: 'add'}
            ],
            foreignKeys: [
                { columnName: 'personID', referenceTable: 'person', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'contactID', referenceTable: 'contact', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'addressID', referenceTable: 'address', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'departmentID', referenceTable: 'department', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'employeeBankID', referenceTable: 'employeeBank', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default EmployeeTable


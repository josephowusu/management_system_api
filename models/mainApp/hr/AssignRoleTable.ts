import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iAssignRoleData, iAssignRoleTableUpdatableColumns } from "../../../modules/interfaces/hr/iAssignRoleTable"


class AssignRoleTable {

    private dataObject:iAssignRoleData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iAssignRoleData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iAssignRoleData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.assignRole
                (id, employeeID, roleID, description, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.employeeID, this.dataObject.roleID, this.dataObject.description, 
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ],
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'assignRoleTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'assignRoleTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iAssignRoleTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.assignRole ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'RoleTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'RoleTable.ts', error)
            return 'error'
        }
    }

    
    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT assignRole.*, employee.*, role.* FROM ${this.schema}.assignRole 
            LEFT JOIN ${this.schema}.employee ON employee.id = assignRole.employeeID
            LEFT JOIN ${this.schema}.role ON role.id = assignRole.roleID
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'RoleTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT assignRole.*, employee.*, role.*  FROM ${this.schema}.assignRole 
            LEFT JOIN ${this.schema}.employee ON employee.id = assignRole.employeeID
            LEFT JOIN ${this.schema}.role ON role.id = assignRole.roleID
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'RoleTable.ts', error)
            return []
        }
    }


    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'assignRole',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'employeeID', dataType: 'BIGINT(100)'},
                {columnName: 'roleID', dataType: 'BIGINT(100)'},
                {columnName: 'description', dataType: 'text'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: [
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'employeeID', referenceTable: 'employee', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'roleID', referenceTable: 'role', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default AssignRoleTable
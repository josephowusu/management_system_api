import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iClientData, iClientUpdatableColumns } from "../../../modules/interfaces/crm/iClientTable"

class ClientTable {

    private dataObject:iClientData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iClientData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iClientData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.client
                (id, personID, addressID, contactID, contactPersonID, contactPersonContactID, contactPersonRole, clientType, clientCategoryID, businessID, Balance, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.personID, this.dataObject.addressID,this.dataObject.contactID,
                this.dataObject.contactPersonID, this.dataObject.contactPersonContactID,
                this.dataObject.contactPersonRole, this.dataObject.clientType, this.dataObject.clientCategoryID, this.dataObject.businessID,
                this.dataObject.balance, this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ],
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'ClientTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'ClientTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iClientUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.client ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'ClientTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'ClientTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`
                SELECT contact.*, address.*, person.*, client.* FROM ${this.schema}.client 
                LEFT JOIN ${this.schema}.person ON person.id = client.personID
                LEFT JOIN ${this.schema}.contact ON contact.id = client.contactID
                LEFT JOIN ${this.schema}.address ON address.id = client.addressID
                WHERE ${search} LIMIT ${limit} OFFSET ${offset}
            `, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'ClientTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`
            SELECT CT1.*, address.*, P1.*, business.*, client.*, CT2.phone AS contactPersonPhone,
            CT2.email AS contactPersonEmail, CONCAT(P2.firstName, " ",P2.otherName, " ", P2.lastName) AS contactPersonName,
            P2.gender as contactPersonGender, CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS clientName 
                FROM ${this.schema}.client 
                Left JOIN ${this.schema}.person AS P1 ON P1.id = client.personID
                Left JOIN ${this.schema}.person AS P2 ON P2.id = client.contactPersonID
                Left JOIN ${this.schema}.address ON address.id = client.addressID
                Left JOIN ${this.schema}.contact AS CT1 ON CT1.id = client.contactID
                Left JOIN ${this.schema}.contact AS CT2 ON CT2.id = client.contactPersonContactID
                Left JOIN ${this.schema}.business ON business.id = client.businessID
                LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'ClientTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'client',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'personID', dataType: 'BIGINT(100)'},
                {columnName: 'addressID', dataType: 'BIGINT(100)'},
                {columnName: 'contactID', dataType: 'BIGINT(100)'},
                {columnName: 'contactPersonID', dataType: 'BIGINT(100)'},
                {columnName: 'contactPersonContactID', dataType: 'BIGINT(100)'},
                {columnName: 'contactPersonRole', dataType: 'varchar(100)'},
                {columnName: 'clientType', dataType: 'varchar(20)'},
                {columnName: 'businessID', dataType: 'BIGINT(100)'},
                {columnName: 'balance', dataType: 'BIGINT(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'clientCategoryID', dataType: 'BIGINT(100)', addOrDrop:'add', afterColumnName: "clientType"},
            ],
            foreignKeys: [
                { columnName: 'personID', referenceTable: 'person', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'addressID', referenceTable: 'address', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'contactID', referenceTable: 'contact', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'contactPersonID', referenceTable: 'person', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'contactPersonContactID', referenceTable: 'contact', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'businessID', referenceTable: 'business', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'clientCategoryID', referenceTable: 'clientCategory', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default ClientTable


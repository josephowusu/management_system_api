import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iExpenseTable, iExpenseTableUpdatableColumns } from "../../../modules/interfaces/miniAccount/iExpenseTable"
import { iCollectionTable, iCollectionTableUpdatableColumns } from "../../../modules/interfaces/miniAccount/iCollectionTable"


class CollectionTable {

    private dataObject:iCollectionTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iCollectionTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iCollectionTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.collection
                
                (id, collectionCategoryID, clientID, serviceID, description, charge, currency, amountPaid, 
                    balance, paymentMethod, companyBankID, chequeNumber, dateOnCheque, mobileMoneyName, 
                    mobileMoneyNumber, paymentDate, paidBy, receivedBy, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.collectionCategoryID, this.dataObject.clientID, 
                this.dataObject.serviceID, this.dataObject.description, this.dataObject.charge,
                this.dataObject.currency, this.dataObject.amountPaid, this.dataObject.balance, 
                this.dataObject.paymentMethod, this.dataObject.companyBankID, this.dataObject.chequeNumber,
                this.dataObject.dateOnCheque, this.dataObject.mobileMoneyName,
                this.dataObject.mobileMoneyNumber, this.dataObject.paymentDate, this.dataObject.paidBy, 
                this.dataObject.receivedBy, this.dataObject.status, this.dataObject.sessionID, 
                this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'collectionTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'collectionTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iCollectionTableUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.collection ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'collectionTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'collectionTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT CC.*, C.*, S.*, CB.*, bank.*, P1.*, collection.*, S.name As serviceName,
            bank.name As bankName, CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS clientName
            FROM ${this.schema}.collection
            LEFT JOIN ${this.schema}.collectionCategory AS CC ON CC.id = collection.collectionCategoryID
            LEFT JOIN ${this.schema}.client AS C ON C.id = collection.clientID
            LEFT JOIN ${this.schema}.service AS S ON S.id = collection.serviceID
            LEFT JOIN ${this.schema}.companyBank AS CB ON CB.id = collection.companyBankID
            LEFT JOIN ${this.schema}.person AS P1 ON P1.id = C.personID
            LEFT JOIN ${this.schema}.bank ON Bank.id = CB.bankID
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'collectionTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT CC.*, C.*, S.*, CB.*, bank.*, P1.*, collection.*, S.name As serviceName,
            bank.name As bankName, CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS clientName
            FROM ${this.schema}.collection
            LEFT JOIN ${this.schema}.collectionCategory AS CC ON CC.id = collection.collectionCategoryID
            LEFT JOIN ${this.schema}.client AS C ON C.id = collection.clientID
            LEFT JOIN ${this.schema}.service AS S ON S.id = collection.serviceID
            LEFT JOIN ${this.schema}.companyBank AS CB ON CB.id = collection.companyBankID
            LEFT JOIN ${this.schema}.person AS P1 ON P1.id = C.personID
            LEFT JOIN ${this.schema}.bank ON Bank.id = CB.bankID
            LIMIT ${limit} OFFSET ${offset}
            `, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'collectionTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'collection',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'collectionCategoryID', dataType: 'BIGINT(100)'},
                {columnName: 'clientID', dataType: 'BIGINT(100)'},
                {columnName: 'serviceID', dataType: 'BIGINT(100)'},
                {columnName: 'description', dataType: 'longtext'},
                {columnName: 'charge', dataType: 'BIGINT(100)'},
                {columnName: 'currency', dataType: 'varchar(10)'},
                {columnName: 'amountPaid', dataType: 'BIGINT(100)'},
                {columnName: 'balance', dataType: 'BIGINT(100)'},
                {columnName: 'paymentMethod', dataType: 'varchar(100)'},
                {columnName: 'companyBankID', dataType: 'BIGINT(100)'},
                {columnName: 'chequeNumber', dataType: 'varchar(100)'},
                {columnName: 'dateOnCheque', dataType: 'varchar(100)'},
                {columnName: 'mobileMoneyName', dataType: 'varchar(100)'},
                {columnName: 'mobileMoneyNumber', dataType: 'varchar(100)'},
                {columnName: 'paymentDate', dataType: 'varchar(100)'},
                {columnName: 'paidBy', dataType: 'varchar(100)'},
                {columnName: 'receivedBy', dataType: 'varchar(100)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'exchangeRate', dataType: 'DOUBLE(20,2)', addOrDrop: "add", afterColumnName:"currency"}
            ],
            foreignKeys: [
                { columnName: 'collectionCategoryID', referenceTable: 'collectionCategory', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'clientID', referenceTable: 'client', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'serviceID', referenceTable: 'service', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'companyBankID', referenceTable: 'companyBank', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default CollectionTable
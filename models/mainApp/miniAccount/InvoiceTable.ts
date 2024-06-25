import MySQL from "mysql"
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iStockTable, iStockUpdatableColumns } from "../../../modules/interfaces/inventory/iStockTable"
import { iInvoiceTable } from "../../../modules/interfaces/miniAccount/iInvoiceTable"


class InvoiceTable {

    private dataObject:iInvoiceTable
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iInvoiceTable, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iInvoiceTable) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            this.dataObject.createdAt = fullDateTime()
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.invoice
                (id, invoiceType, invoiceDate, clientID, reference, companyBankID, itemList, invoiceAmount, invoiceBalance,
                currency, exchangeRate, tax, preparedBy, status, sessionID, createdAt) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.invoiceType, this.dataObject.invoiceDate, 
                this.dataObject.clientID, this.dataObject.reference, this.dataObject.companyBankID, 
                this.dataObject.itemList, this.dataObject.invoiceAmount, this.dataObject.invoiceBalance, this.dataObject.currency, 
                this.dataObject.tax,  this.dataObject.exchangeRate, this.dataObject.preparedBy, 
                this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'invoiceTable.ts', JSON.stringify(result))
                return {type: 'error1'}
            }
        } catch (error:any) {
            Logger.log('error', 'invoiceTable.ts', error)
            console.log(`INSERT INTO invoice
            (id, invoiceType, invoiceDate, clientID, reference, companyBankID, itemList, invoiceAmount, invoiceBalance,
            currency, exchangeRate, tax, preparedBy, status, sessionID, createdAt) 
            VALUES `, this.dataObject.id, this.dataObject.invoiceType, this.dataObject.invoiceDate, 
            this.dataObject.clientID, this.dataObject.reference, this.dataObject.companyBankID, 
            this.dataObject.itemList, this.dataObject.invoiceAmount, this.dataObject.invoiceBalance, this.dataObject.currency, 
            this.dataObject.tax,  this.dataObject.exchangeRate, this.dataObject.preparedBy, 
            this.dataObject.status, this.dataObject.sessionID, this.dataObject.createdAt)
            return {type: 'error2'}
        }
    }

    public async update(columnsToUpdate:iStockUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.invoice ${sqlStatement.sql} WHERE id = ? AND status = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'invoiceTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'invoiceTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT  business.*, client.*, contact.*, address.*, P1.*, invoice.*,
            CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS clientName 
            FROM ${this.schema}.invoice 
            Left JOIN ${this.schema}.client ON client.id = invoice.clientID
            Left JOIN ${this.schema}.person AS P1 ON P1.id = client.personID
            Left JOIN ${this.schema}.contact ON contact.id = client.contactID
            Left JOIN ${this.schema}.address ON address.id = client.addressID
            Left JOIN ${this.schema}.business ON business.id = client.businessID
            left JOIN ${this.schema}.companyBank ON companyBank.id = invoice.companyBankID 
            WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'InvoiceTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT  business.*, client.*, companyBank.*, contact.*, address.*, P1.*, invoice.*,
            CONCAT(P1.firstName, " ",P1.otherName, " ", P1.lastName) AS clientName 
            FROM ${this.schema}.invoice 
            Left JOIN ${this.schema}.client ON client.id = invoice.clientID
            Left JOIN ${this.schema}.person AS P1 ON P1.id = client.personID
            Left JOIN ${this.schema}.contact ON contact.id = client.contactID
            Left JOIN ${this.schema}.address ON address.id = client.addressID
            Left JOIN ${this.schema}.business ON business.id = client.businessID
            left JOIN ${this.schema}.companyBank ON companyBank.id = invoice.companyBankID 
            LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'invoiceTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'invoice',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'invoiceType', dataType: 'varchar(100)'},
                {columnName: 'invoiceDate',  dataType: 'varchar(100)'},
                {columnName: 'clientID', dataType: 'BIGINT(100)'},
                {columnName: 'reference', dataType: 'varchar(100)'},
                {columnName: 'companyBankID', dataType: 'BIGINT(100)'},
                {columnName: 'currency', dataType: 'varchar(100)'},
                {columnName: 'exchangeRate', dataType: 'DOUBLE(20,2)'},
                {columnName: 'itemList', dataType: 'longtext'},
                {columnName: 'invoiceAmount', dataType: 'BIGINT(100)'},
                {columnName: 'tax', dataType: 'boolean'},
                {columnName: 'preparedBy', dataType: 'varchar(200)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'sessionID', dataType: 'BIGINT(100)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [
                {columnName: 'preparedBy', dataType: 'varchar(200)', addOrDrop: "add", afterColumnName:"tax"},
                {columnName: 'companyBankID', dataType: 'BIGINT(100)', addOrDrop: "add", afterColumnName:"reference"},
                {columnName: 'exchangeRate', dataType: 'DOUBLE(20,2)', addOrDrop: "add", afterColumnName:"currency"},
                {columnName: 'invoiceBalance', dataType: 'DOUBLE(20,2)', addOrDrop: "add", afterColumnName:"currency"}
            ],
            foreignKeys: [
                { columnName: 'clientID', referenceTable: 'client', keyName: 'id', addOrDrop: 'add' },
                { columnName: 'sessionID', referenceTable: 'session', keyName: 'id', addOrDrop: 'add' }
            ]
        }
    }
}

export default InvoiceTable
import { dbQuery, fullDateTime, generateID, getUpdateSqlStatement } from "../../modules/GeneralModules"
import Logger from "../../modules/Logger"
import MySQL from "mysql"
import { iGetCreateTableDetails } from "../../modules/interfaces/iMigration"
import { iSoftwarePurchaseData, iSoftwarePurchaseDataUpdatableColumns } from "../../modules/interfaces/core/iSoftwarePurchase"


class SoftwarePurchaseTable {

    private dataObject:iSoftwarePurchaseData
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iSoftwarePurchaseData, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID(), status: 'active' }
        this.database = database
        this.schema = schema ? schema : ''
        console.log(':schema', schema)
    }

    public setValues(data:iSoftwarePurchaseData) {
        this.dataObject = {...this.dataObject, ...data}
    }

    private ifEmpty() {
        return (this.dataObject.id && this.dataObject.businessCode)
    }

    public async save() {
        try {
            if (this.ifEmpty()) {
                this.dataObject.createdAt = fullDateTime()
                let result:any = await dbQuery(`
                    INSERT INTO ${this.schema}.softwarePurchase 
                    (id, businessID, businessCode, softwarePackageID, paymentMethod, accountNumber, accountName, packagePrice, numberOfMonths, 
                    paidAmount, paymentDate, referenceNumber, email, phone, transactionId, endOfSubscriptionDate, status, createdAt) 
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                `, [
                    this.dataObject.id, this.dataObject.businessID, this.dataObject.businessCode, this.dataObject.softwarePackageID, this.dataObject.paymentMethod, 
                    this.dataObject.accountNumber, this.dataObject.accountName, this.dataObject.packagePrice, this.dataObject.numberOfMonths, 
                    this.dataObject.paidAmount, this.dataObject.paymentDate, this.dataObject.referenceNumber, this.dataObject.email, this.dataObject.phone, 
                    this.dataObject.transactionId, this.dataObject.endOfSubscriptionDate, this.dataObject.status, this.dataObject.createdAt
                ], 
                this.database)
                if (result && result.affectedRows) {
                    return {type: 'success', primaryKey: this.dataObject.id}
                } else {
                    Logger.log('error', 'SoftwarePurchaseTable.ts', JSON.stringify(result))
                    return {type: 'error'}
                }
            } else {
                return {type: 'empty'}
            }
        } catch (error:any) {
            Logger.log('error', 'SoftwarePurchaseTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iSoftwarePurchaseDataUpdatableColumns[]) {
        try {
            if (this.ifEmpty()) {
                const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
                let sql = `UPDATE ${this.schema}.softwarePurchase ${sqlStatement.sql} WHERE id = ? AND status = ?`
                let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
                let result:any = await dbQuery(sql, columns, this.database)
                if (result && result.affectedRows) {
                    return 'success'
                } else {
                    Logger.log('error', 'SoftwarePurchaseTable.ts', JSON.stringify(result))
                    return 'error'
                }
            } else {
                return 'empty'
            }
        } catch (error:any) {
            Logger.log('error', 'SoftwarePurchaseTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result
            if (limit) {
                values.push(limit)
                values.push(offset)
                result = await dbQuery(`
                    SELECT softwarePackage.*, softwarePurchase.*
                    FROM ${this.schema}.softwarePurchase 
                    LEFT JOIN ${this.schema}.softwarePackage ON softwarePackage.id = softwarePurchase.softwarePackageID
                    WHERE ${search} LIMIT ? OFFSET ?
                `, values, this.database)
            } else {
                result = await dbQuery(`
                    SELECT softwarePackage.*, softwarePurchase.*
                    FROM ${this.schema}.softwarePurchase 
                    LEFT JOIN ${this.schema}.softwarePackage ON softwarePackage.id = softwarePurchase.softwarePackageID
                    WHERE ${search}
                `, values, this.database)
            }
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SoftwarePurchaseTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result
            if (limit) {
                result = await dbQuery(`
                    SELECT softwarePackage.*, softwarePurchase.*
                    FROM ${this.schema}.softwarePurchase 
                    LEFT JOIN softwarePurchase ON softwarePurchase.id = softwarePurchase.softwarePackageID
                    LIMIT ? OFFSET ?
                `, [limit, offset], this.database)
            } else {
                result = await dbQuery(`
                    SELECT softwarePackage.*, softwarePurchase.*
                    FROM ${this.schema}.softwarePurchase 
                    LEFT JOIN softwarePurchase ON softwarePurchase.id = softwarePurchase.softwarePackageID
                `, [], this.database)
            }
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'SoftwarePurchaseTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'softwarePurchase',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'businessID', dataType: 'BIGINT(100)'},
                {columnName: 'businessCode', dataType: 'varchar(50)'},
                {columnName: 'softwarePackageID', dataType: 'BIGINT(100)'},
                {columnName: 'paymentMethod', dataType: 'varchar(100)'},
                {columnName: 'accountNumber', dataType: 'varchar(50)'},
                {columnName: 'accountName', dataType: 'varchar(255)'},
                {columnName: 'packagePrice', dataType: 'double(10,2)'},
                {columnName: 'numberOfMonths', dataType: 'int'},
                {columnName: 'paidAmount', dataType: 'double(10,2)'},
                {columnName: 'paymentDate', dataType: 'varchar(20)'},
                {columnName: 'referenceNumber', dataType: 'varchar(50)'},
                {columnName: 'email', dataType: 'text'},
                {columnName: 'phone', dataType: 'varchar(20)'},
                {columnName: 'transactionId', dataType: 'varchar(255)'},
                {columnName: 'endOfSubscriptionDate', dataType: 'varchar(20)'},
                {columnName: 'status', dataType: 'varchar(50)'},
                {columnName: 'createdAt', dataType: 'datetime'}
            ],
            alterColumns: [],
            foreignKeys: []
        }
    }
}

export default SoftwarePurchaseTable

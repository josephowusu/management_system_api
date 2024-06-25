import MySQL from "mysql"
import { dbQuery, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iMiniAccountPrivilege, iMiniAccountPrivilegeUpdatableColumns } from "../../../modules/interfaces/miniAccount/iMiniAccountPrivileges"



class MiniAccountPrivilegeTable {
    
    private dataObject:iMiniAccountPrivilege
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iMiniAccountPrivilege, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iMiniAccountPrivilege) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.miniAccountPrivilege 
                (id, userID, groupID, addNewInvoice, updateExistingInvoice, deactivateExistingInvoice, 
                    deleteExistingInvoice, addNewCompanyBank, updateExistingCompanyBank, 
                    deactivateExistingCompanyBank, deleteExistingCompanyBank, addNewExpenseCategory,
                    updateExistingExpenseCategory, deactivateExistingExpenseCategory, deleteExistingExpenseCategory, 
                    addNewExpense, updateExistingExpense, deactivateExistingExpense, deleteExistingExpense, addNewCollection,
                    updateExistingCollection, deactivateExistingCollection, deleteExistingCollection, 
                    addNewCollectionCategory, updateExistingCollectionCategory, deactivateCollectionCategory, deleteCollectionCategory,
                    assignAllPrivileges, addNewDebt, updateExistingDebt, deactivateDebt, deleteDebt, addNewDebtCategory, 
                    updateExistingDebtCategory, deactivateDebtCategory, deleteDebtCategory) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.groupID, 
                this.dataObject.addNewInvoice, this.dataObject.updateExistingInvoice, this.dataObject.deactivateExistingInvoice,
                this.dataObject.deleteExistingInvoice, this.dataObject.addNewCompanyBank, this.dataObject.updateExistingCompanyBank,
                this.dataObject.deactivateExistingCompanyBank, this.dataObject.deleteExistingCompanyBank, this.dataObject.addNewExpenseCategory, this.dataObject.updateExistingExpenseCategory, 
                this.dataObject.deactivateExistingExpenseCategory, this.dataObject.deleteExistingExpenseCategory, this.dataObject.addNewExpense,
                this.dataObject.updateExistingExpense, this.dataObject.deactivateExistingExpense, this.dataObject.deleteExistingExpense,
                this.dataObject.addNewCollection, this.dataObject.updateExistingCollection, 
                this.dataObject.deactivateExistingCollection, this.dataObject.deleteExistingCollection, this.dataObject.addNewCollectionCategory,
                this.dataObject.updateExistingCollectionCategory, this.dataObject.deactivateCollectionCategory, this.dataObject.deleteCollectionCategory,
                this.dataObject.assignAllPrivileges, this.dataObject.addNewDebt,this.dataObject.updateExistingDebt, this.dataObject.deactivateDebt, this.dataObject.deleteDebt,
                this.dataObject.addNewDebtCategory, this.dataObject.updateExistingDebtCategory, this.dataObject.deactivateDebtCategory, this.dataObject.deleteDebtCategory
            ], 
            this.database) 
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'MiniAccountPrivilegeTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'MiniAccountPrivilegeTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iMiniAccountPrivilegeUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.miniAccountPrivilege ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'MiniAccountPrivilegeTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'MiniAccountPrivilegeTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.miniAccountPrivilege WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'MiniAccountPrivilegeTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.miniAccountPrivilege LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'MiniAccountPrivilegeTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'miniAccountPrivilege',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'groupID', dataType: 'BIGINT(100)'},
                {columnName: 'addNewInvoice', dataType: 'varchar(5)'},
                {columnName: 'updateExistingInvoice', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingInvoice', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingInvoice', dataType: 'varchar(5)'},
                {columnName: 'addNewCompanyBank', dataType: 'varchar(5)'},
                {columnName: 'updateExistingCompanyBank', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingCompanyBank', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingCompanyBank', dataType: 'varchar(5)'},
                {columnName: 'addNewExpenseCategory', dataType: 'varchar(5)'},
                {columnName: 'updateExistingExpenseCategory', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingExpenseCategory', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingExpenseCategory', dataType: 'varchar(5)'},
                {columnName: 'addNewExpense', dataType: 'varchar(5)'},
                {columnName: 'updateExistingExpense', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingExpense', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingExpense', dataType: 'varchar(5)'},
                {columnName: 'addNewCollection', dataType: 'varchar(5)'},
                {columnName: 'updateExistingCollection', dataType: 'varchar(5)'},
                {columnName: 'deactivateExistingCollection', dataType: 'varchar(5)'},
                {columnName: 'deleteExistingCollection', dataType: 'varchar(5)'},
                {columnName: 'addNewCollectionCategory', dataType: 'varchar(5)'},
                {columnName: 'updateExistingCollectionCategory', dataType: 'varchar(5)'},
                {columnName: 'deactivateCollectionCategory', dataType: 'varchar(5)'},
                {columnName: 'deleteCollectionCategory', dataType: 'varchar(5)'},
                {columnName: 'assignAllPrivileges', dataType: 'varchar(5)'}
            ],
            alterColumns: [
              {columnName: 'addNewDebt', dataType: 'varchar(5)', addOrDrop:'add'},
              {columnName: 'updateExistingDebt', dataType: 'varchar(5)', addOrDrop:'add'},
              {columnName: 'deactivateDebt', dataType: 'varchar(5)', addOrDrop:'add'},
              {columnName: 'deleteDebt', dataType: 'varchar(5)', addOrDrop:'add'},
              {columnName: 'addNewDebtCategory', dataType: 'varchar(5)', addOrDrop:'add'},
              {columnName: 'updateExistingDebtCategory', dataType: 'varchar(5)', addOrDrop:'add'},
              {columnName: 'deactivateDebtCategory', dataType: 'varchar(5)', addOrDrop:'add'},
              {columnName: 'deleteDebtCategory', dataType: 'varchar(5)', addOrDrop:'add'}
            ],
            foreignKeys: []
        }
    }

    public columnsList() {
        return [
            {
              title: "Assign All Privileges",
              name: "assignAllPrivileges",
              description: "User will be able to grant full access and permissions.",
            },
            {
                title: "Add New Invoice",
                name: "addNewInvoice",
                description: "User will be able to create a new invoice.",
              },
              {
                title: "Update Existing Invoice",
                name: "updateExistingInvoice",
                description:
                  "User will be able to make changes to an invoice that is already existing.",
              },
              {
                title: "Deactivate Existing Invoice",
                name: "deactivateExistingInvoice",
                description:
                  "User will be able to disconnect an invoice that already exists.",
              },
              {
                title: "Delete Existing Invoice",
                name: "deleteExistingInvoice",
                description: "User will be able to remove an invoice that already exists.",
              },
              {
                title: "Add New Company Bank",
                name: "addNewCompanyBank",
                description: "User will be able to create a new company bank account. ",
              },
              {
                title: "Update Existing Company Bank",
                name: "updateExistingCompanyBank",
                description:
                  "User will be able to make changes to a company's bank account that is already existing.",
              },
              {
                title: "Deactivate Existing Company Bank",
                name: "deactivateExistingCompanyBank",
                description:
                  "User will be able to disconnect a company's bank account that already exists.",
              },
              {
                title: "Delete Existing Company Bank",
                name: "deleteExistingCompanyBank",
                description:
                  "User will be able to remove a company's bank account that already exists.",
              },
              {
                title: "Add New Expense Category",
                name: "addNewExpenseCategory",
                description: "User will be able to create a new group for expenses.",
              },
              {
                title: "Update Existing Expense Category",
                name: "updateExistingExpenseCategory",
                description:
                  "User will be able to make changes to an expense group that is already existing.",
              },
              {
                title: "Deactivate Existing ExpenseCategory",
                name: "deactivateExistingExpenseCategory",
                description:
                  "User will be able to disconnect an expense group that already exists.",
              },
              {
                title: "Delete Existing Expense Category",
                name: "deleteExistingExpenseCategory",
                description:
                  "User will be able to remove an expense group that already exists.",
              },
              {
                title: "Add New Expense",
                name: "addNewExpense",
                description: "User will be able to create a new expense entry.",
              },
              {
                title: "Update Existing Expense",
                name: "updateExistingExpense",
                description:
                  "User will be able to make changes to an expense that is already existing.",
              },
              {
                title: "Deactivate Existing Expense",
                name: "deactivateExistingExpense",
                description:
                  "User will be able to disconnect an expense that already exists.",
              },
              {
                title: "Delete Existing Expense",
                name: "deleteExistingExpense",
                description: "User will be able to remove an expense that already exists.",
              },
              {
                title: "Add New Collection",
                name: "addNewCollection",
                description:
                  "User will be able to create a new entry of payment collection.",
              },
              {
                title: "Update Existing Collection",
                name: "updateExistingCollection",
                description:
                  "User will be able to make changes to a payment collection that is already existing.",
              },
              {
                title: "Deactivate Existing Collection",
                name: "deactivateExistingCollection",
                description:
                  "User will be able to disconnect a payment collection that already exists.",
              },
              {
                title: "Delete Existing Collection",
                name: "deleteExistingCollection",
                description:
                  "User will be able to remove a payment collection that already exists.",
              },
              {
                title: "Add New Collection Category",
                name: "addNewCollectionCategory",
                description: "User will be able to create a new payment collection group.",
              },
              {
                title: "Update Existing Collection Category",
                name: "updateExistingCollectionCategory",
                description:
                  "User will be able to make changes to a payment collection group that is already existing.",
              },
              {
                title: "Deactivate Collection Category",
                name: "deactivateCollectionCategory",
                description:
                  "User will be able to disconnect a payment collection group that already exists.",
              },
              {
                title: "Delete Collection Category",
                name: "deleteCollectionCategory",
                description:
                  "User will be able to remove a payment collection group that already exists",
              },

              {
                title: "Add New Debt",
                name: "addNewDebt",
                description: "User will be able to create a new debt.",
              },
              {
                title: "Update Existing Debt",
                name: "updateExistingDebt",
                description:
                  "User will be able to make changes to a debt that is already existing.",
              },
              {
                title: "Deactivate Debt",
                name: "deactivateDebt",
                description:
                  "User will be able to disconnect a debt that already exists.",
              },
              {
                title: "Delete Debt",
                name: "deleteDebt",
                description:
                  "User will be able to remove a debt that already exists",
              },
              {
                title: "Add New Debt Category",
                name: "addNewDebtCategory",
                description: "User will be able to create a new Debt Category.",
              },
              {
                title: "Update Existing Debt Category",
                name: "updateExistingDebtCategory",
                description:
                  "User will be able to make changes to a debt category that is already existing.",
              },
              {
                title: "Deactivate Debt Category",
                name: "deactivateDebtCategory",
                description:
                  "User will be able to disconnect a debt category that already exists.",
              },
              {
                title: "Delete Debt Category",
                name: "deleteDebtCategory",
                description:
                  "User will be able to remove a debt category that already exists",
              },
              
        ]
    }
}


export default MiniAccountPrivilegeTable


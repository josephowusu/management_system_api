import MySQL from 'mysql'
import { iCreateTableColumn, iGetCreateTableDetails, iModelList } from '../../modules/interfaces/iMigration'
import DatabaseConnection from './DatabaseConnection'
import { dbQuery } from '../../modules/GeneralModules'
import Logger from '../../modules/Logger'


class DatabaseMigration {
    private database:MySQL.Connection|null
    private schemaName:string
    private modelList:iGetCreateTableDetails[]

    constructor(database:MySQL.Connection|null, schemaName:string, ModelList:iModelList[], ModelsToExecute?:string[]) {
        this.database = database ? database : DatabaseConnection.__init__()
        this.schemaName = schemaName
        this.modelList = this.getAllModelLists(ModelList, ModelsToExecute)
    }

    private async checkIfExist(type:'database'|'table'|'column'|'foreignKey', columnName?:string, tableName?:string, schemaName?:string) {
        let sql, columns:any = []
        if (type === 'database') {
            sql = `SHOW DATABASES LIKE ?`
            columns = [schemaName ? schemaName : this.schemaName]
        } else if (type === 'table') {
            sql = `SHOW TABLES from ${schemaName ? schemaName : this.schemaName} LIKE ?`
            columns = [tableName]
        } else if (type === 'foreignKey') {
            sql = `
                SELECT * 
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE 
                TABLE_SCHEMA = ? AND 
                TABLE_NAME = ? AND 
                COLUMN_NAME = ? AND
                CONSTRAINT_NAME LIKE '%ibfk%'
            `
            columns = [schemaName ? schemaName : this.schemaName, tableName, columnName]
        } else {
            sql = `SHOW COLUMNS from ${schemaName ? schemaName : this.schemaName}.${tableName} LIKE ?`
            columns = [columnName]
        }

        const result = await dbQuery(sql, columns, this.database)
        return Array.isArray(result) && result.length > 0 ? true : false
    }

    private getAllModelLists(ModelList:iModelList[], ModelsToExecute?:string[]) {
        let listArray:iGetCreateTableDetails[] = []
        if (ModelList.length) {
            if (ModelsToExecute && ModelsToExecute.length) {
                for (let i = 0; i < ModelList.length; i++) {
                    const Model = ModelList[i]
                    if (ModelsToExecute.includes(Model.tableName)) {
                        listArray.push(Model.tableDescription)
                    }
                }
            } else {
                for (let i = 0; i < ModelList.length; i++) {
                    listArray.push(ModelList[i].tableDescription)
                }
            }
        }
        return listArray
    }

    public async createDatabase(schemaName?:string, ModelList?:iModelList[], ModelsToExecute?:string[]) {
        if (ModelList) {
            this.modelList = this.getAllModelLists(ModelList, ModelsToExecute)
        }

        if (this.schemaName || schemaName) {
            let result = await this.checkIfExist('database', undefined, undefined, schemaName)
            if (result) {
                return this.createTables()
            } else {
                const sql = ` CREATE DATABASE ${schemaName ? schemaName : this.schemaName}; `
                let result:any = await dbQuery(sql, [], this.database)
                if (result && result.affectedRows != undefined) {
                    return this.createTables(schemaName)
                } else {
                    Logger.log('warning', 'DatabaseMigration.ts', `An error occurred while creating database: => ${result}`)
                    return false
                }
            }
        } else {
            Logger.log('warning', 'DatabaseMigration.ts', `Schema name not found!`)
            return false
        }
    }

    private async createTables(schemaName?:string) {
        //Create table loop
        for (let i = 0; i < this.modelList.length; i++) {
            const model = this.modelList[i]
            await this.createTable(model, schemaName)
        }

        //Alter table loop
        for (let i = 0; i < this.modelList.length; i++) {
            const model = this.modelList[i]
            await this.alterTable(model, schemaName)
        }

        //Add foreign keys loop
        for (let i = 0; i < this.modelList.length; i++) {
            const model = this.modelList[i]
            await this.addForeignKey(model, schemaName)
        }

        return true
    }

    private async createTable(model:iGetCreateTableDetails, schemaName?:string) {
        let result = await this.checkIfExist('table', undefined, model.tableName, schemaName)
        if (!result) {
            const sql = this.generateSQLCreateStatement(model.tableName, model.columns, schemaName)
            let queryResult:any = await dbQuery(sql, [], this.database)
            if (queryResult && queryResult.affectedRows != undefined) {
                Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ' table is created successfully!')
                return true
            } else {
                Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ' table could not be created!')
                return false
            }
        } else {
            Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ' table already exist!')
            return false
        }
    } 

    private async alterTable(model:iGetCreateTableDetails, schemaName?:string) {
        for (let i = 0; i < model.alterColumns.length; i++) {
            const column = model.alterColumns[i]
            let result = await this.checkIfExist('column', column.columnName, model.tableName, schemaName)
            if (!result) {
                let sql
                if (column.addOrDrop === 'add') {
                    sql = `
                        ALTER TABLE ${schemaName ? schemaName : this.schemaName}.${model.tableName}
                        ADD COLUMN ${column.columnName} ${column.dataType} ${column.afterColumnName ? `AFTER ${column.afterColumnName}` : ''};
                    `
                    let queryResult:any = await dbQuery(sql, [], this.database)
                    if (queryResult && queryResult.affectedRows != undefined) {
                        Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` column ${column.columnName} is ${column.addOrDrop === 'add' ? 'added' : 'dropped'} successfully!`)
                    } else {
                        Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` column ${column.columnName} could not be ${column.addOrDrop === 'add' ? 'added' : 'dropped'}!`)
                    }
                }
            } else {
                // console.warn(model.tableName, ` column ${column.columnName} already exist!`)
                if (column.addOrDrop === 'drop') {
                    let sql = `
                        ALTER TABLE ${schemaName ? schemaName : this.schemaName}.${model.tableName}
                        DROP COLUMN ${column.columnName};
                    `
                    let queryResult:any = await dbQuery(sql, [], this.database)
                    if (queryResult && queryResult.affectedRows != undefined) {
                        Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` column ${column.columnName}  is dropped successfully!`)
                    } else {
                        Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` column ${column.columnName} could not be dropped!`)
                    }
                }
            }
        }

        return true
    }

    private async addForeignKey(model:iGetCreateTableDetails, schemaName?:string) {
        for (let i = 0; i < model.foreignKeys.length; i++) {
            const column = model.foreignKeys[i]
            let result = await this.checkIfExist('foreignKey', column.columnName, model.tableName, schemaName)
            if (!result) {
                let sql
                if (column.addOrDrop === 'add') {
                    sql = `
                        ALTER TABLE ${schemaName ? schemaName : this.schemaName}.${model.tableName} 
                        ADD FOREIGN KEY(${column.columnName}) REFERENCES ${schemaName ? schemaName : this.schemaName}.${column.referenceTable}(${column.keyName}); 
                    `
                    let queryResult:any = await dbQuery(sql, [], this.database)
                    if (queryResult && queryResult.affectedRows != undefined) {
                        Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` foreign key ${column.columnName}  is added successfully!`)
                    } else {
                        Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` foreign key ${column.columnName} could not be added!`)
                    }
                } else {
                    sql = `
                        SELECT * 
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                        WHERE 
                        TABLE_SCHEMA = ? AND 
                        TABLE_NAME = ? AND 
                        COLUMN_NAME = ? AND
                        CONSTRAINT_NAME LIKE '%ibfk%'
                    `
                    let columns:string[] = [(schemaName ? schemaName : (this.schemaName ? this.schemaName : '')), model.tableName, column.columnName]
                    let result = await dbQuery(sql, columns, this.database)
                    if (Array.isArray(result) && result.length) {
                        sql = `ALTER TABLE ${schemaName ? schemaName : this.schemaName}.${model.tableName} DROP FOREIGN KEY ${result[0].CONSTRAINT_NAME};`
                        let queryResult:any = await dbQuery(sql, [], this.database)
                        if (queryResult && queryResult.affectedRows != undefined) {
                            Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` foreign key ${column.columnName}  is dropped successfully!`)
                        } else {
                            Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` foreign key ${column.columnName} could not be dropped!`)
                        }
                    }
                }
            } else {
                // console.warn(model.tableName, ` foreign key ${column.keyName} already exist!`)
                if (column.addOrDrop === 'drop') {
                    let sql = `
                        SELECT * 
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                        WHERE 
                        TABLE_SCHEMA = ? AND 
                        TABLE_NAME = ? AND 
                        COLUMN_NAME = ? AND
                        CONSTRAINT_NAME LIKE '%ibfk%'
                    `
                    let columns:string[] = [(schemaName ? schemaName : (this.schemaName ? this.schemaName : '')), model.tableName, column.columnName]
                    let result = await dbQuery(sql, columns, this.database)
                    if (Array.isArray(result) && result.length) {
                        sql = `ALTER TABLE ${schemaName ? schemaName : this.schemaName}.${model.tableName} DROP FOREIGN KEY ${result[0].CONSTRAINT_NAME};`
                        let queryResult:any = await dbQuery(sql, [], this.database)
                        if (queryResult && queryResult.affectedRows != undefined) {
                            Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` foreign key ${column.columnName}  is dropped successfully!`)
                        } else {
                            Logger.log('warning', 'DatabaseMigration.ts', model.tableName + ` foreign key ${column.columnName} could not be dropped!`)
                        }
                    }
                }
            }
        }

        return true
    }

    private generateSQLCreateStatement (tableName:string, columns:iCreateTableColumn[], schemaName?:string) {
        let createTableSql = String.raw` CREATE TABLE IF NOT EXISTS ${schemaName ? schemaName : this.schemaName}.${tableName} ( `
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i]
            createTableSql += `
                ${i === 0 ? '' : ','} 
                ${column.columnName} ${column.dataType} 
                ${column.primaryKey ? 'PRIMARY KEY' : ''}
                ${column.notNull ? 'NOT NULL' : ''}
            `
        }
        createTableSql += String.raw`)  ENGINE=INNODB;`
        return createTableSql
    }
}


export default DatabaseMigration
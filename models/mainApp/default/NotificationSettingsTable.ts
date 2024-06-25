import MySQL from "mysql"

import { dbQuery, generateID, getUpdateSqlStatement } from "../../../modules/GeneralModules"
import Logger from "../../../modules/Logger"
import { iGetCreateTableDetails } from "../../../modules/interfaces/iMigration"
import { iNotificationSettings, iNotificationSettingsUpdatableColumns } from "../../../modules/interfaces/default/iNotificationSettings"


class NotificationSettings {
    
    private dataObject:iNotificationSettings
    private database:MySQL.Connection|null|undefined
    private schema:string

    constructor(data?:iNotificationSettings, database?:MySQL.Connection|null, schema?:string) {
        this.dataObject = data ? data : { id: generateID() }
        this.database = database
        this.schema = schema ? schema : ''
    }

    public setValues(data:iNotificationSettings) {
        this.dataObject = {...this.dataObject, ...data}
    }

    public async save() {
        try {
            let result:any = await dbQuery(`
                INSERT INTO ${this.schema}.notificationSettings 
                (id, userID, newInsertInApp, newInsertSMS, newInsertEmail, updateInApp, updateSMS, updateEmail, deactivateInApp, deactivateSMS, 
                deactivateEmail, reactivateInApp, reactivateSMS, reactivateEmail, deleteInApp, deleteSMS, deleteEmail, paymentInApp, 
                paymentSMS, paymentEmail, systemInApp, systemSMS, systemEmail) 
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            `, [
                this.dataObject.id, this.dataObject.userID, this.dataObject.newInsertInApp, this.dataObject.newInsertSMS, 
                this.dataObject.newInsertEmail, this.dataObject.updateInApp, this.dataObject.updateSMS,
                this.dataObject.updateEmail, this.dataObject.deactivateInApp, this.dataObject.deactivateSMS,
                this.dataObject.deactivateEmail, this.dataObject.reactivateInApp, this.dataObject.reactivateSMS,
                this.dataObject.reactivateEmail, this.dataObject.deleteInApp,
                this.dataObject.deleteSMS, this.dataObject.deleteEmail, this.dataObject.paymentInApp,
                this.dataObject.paymentSMS, this.dataObject.paymentEmail, this.dataObject.systemInApp,
                this.dataObject.systemSMS, this.dataObject.systemEmail
            ], 
            this.database)
            if (result && result.affectedRows) {
                return {type: 'success', primaryKey: this.dataObject.id}
            } else {
                Logger.log('error', 'NotificationSettingsTable.ts', JSON.stringify(result))
                return {type: 'error'}
            }
        } catch (error:any) {
            Logger.log('error', 'NotificationSettingsTable.ts', error)
            return {type: 'error'}
        }
    }

    public async update(columnsToUpdate:iNotificationSettingsUpdatableColumns[]) {
        try {
            const sqlStatement = getUpdateSqlStatement(this.dataObject, columnsToUpdate)
            let sql = `UPDATE ${this.schema}.notificationSettings ${sqlStatement.sql} WHERE id = ?`
            let columns = [...sqlStatement.columns, this.dataObject.id, 'active']
            let result:any = await dbQuery(sql, columns, this.database)
            if (result && result.affectedRows) {
                return 'success'
            } else {
                Logger.log('error', 'NotificationSettingsTable.ts', JSON.stringify(result))
                return 'error'
            }
        } catch (error:any) {
            Logger.log('error', 'NotificationSettingsTable.ts', error)
            return 'error'
        }
    }

    public async get(search:string, values:any[], limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.notificationSettings WHERE ${search} LIMIT ${limit} OFFSET ${offset}`, values, this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'NotificationSettingsTable.ts', error)
            return []
        }
    }

    public async getAll(limit:number, offset:number) {
        try {
            let result = await dbQuery(`SELECT * FROM ${this.schema}.notificationSettings LIMIT ${limit} OFFSET ${offset}`, [], this.database)
            return Array.isArray(result) ? result : []
        } catch (error:any) {
            Logger.log('error', 'NotificationSettingsTable.ts', error)
            return []
        }
    }

    public tableDescription():iGetCreateTableDetails {
        return {
            tableName: 'notificationSettings',
            columns: [
                {columnName: 'id', dataType: 'BIGINT(100)', primaryKey: true, notNull: true},
                {columnName: 'userID', dataType: 'BIGINT(100)'},
                {columnName: 'newInsertInApp', dataType: 'varchar(5)'},
                {columnName: 'newInsertSMS', dataType: 'varchar(5)'},
                {columnName: 'newInsertEmail', dataType: 'varchar(5)'},
                {columnName: 'updateInApp', dataType: 'varchar(5)'},
                {columnName: 'updateSMS', dataType: 'varchar(5)'},
                {columnName: 'updateEmail', dataType: 'varchar(5)'},
                {columnName: 'deactivateInApp', dataType: 'varchar(5)'},
                {columnName: 'deactivateSMS', dataType: 'varchar(5)'},
                {columnName: 'deactivateEmail', dataType: 'varchar(5)'},
                {columnName: 'reactivateInApp', dataType: 'varchar(5)'},
                {columnName: 'reactivateSMS', dataType: 'varchar(5)'},
                {columnName: 'reactivateEmail', dataType: 'varchar(5)'},
                {columnName: 'deleteInApp', dataType: 'varchar(5)'},
                {columnName: 'deleteSMS', dataType: 'varchar(5)'},
                {columnName: 'deleteEmail', dataType: 'varchar(5)'},
                {columnName: 'paymentInApp', dataType: 'varchar(5)'},
                {columnName: 'paymentSMS', dataType: 'varchar(5)'},
                {columnName: 'paymentEmail', dataType: 'varchar(5)'},
                {columnName: 'systemInApp', dataType: 'varchar(5)'},
                {columnName: 'systemSMS', dataType: 'varchar(5)'},
                {columnName: 'systemEmail', dataType: 'varchar(5)'},
                {columnName: 'chatInApp', dataType: 'varchar(5)'},
                {columnName: 'emailSMS', dataType: 'varchar(5)'},
                {columnName: 'emailEmail', dataType: 'varchar(5)'}
            ],
            alterColumns: [],
            foreignKeys: []
        }
    }

    public columnsList() {
        return [
			{
				title: "Every created/added record",
				name: "newInsertAction",
				description: "",
				list: [
					{
						name: 'newInsertInApp',
						title: 'In App'
					},
					{
						name: 'newInsertSMS',
						title: 'Via SMS'
					},
					{
						name: 'newInsertEmail',
						title: 'Via Email'
					}
				]
			},
			{
				title: "Every update action",
				name: "updateAction",
				description: "",
				list: [
					{
						name: 'updateInApp',
						title: 'In App'
					},
					{
						name: 'updateSMS',
						title: 'Via SMS'
					},
					{
						name: 'updateEmail',
						title: 'Via Email'
					}
				]
			},
			{
				title: "Every deactivate action",
				name: "deactivateAction",
				description: "",
				list: [
					{
						name: 'deactivateInApp',
						title: 'In App'
					},
					{
						name: 'deactivateSMS',
						title: 'Via SMS'
					},
					{
						name: 'deactivateEmail',
						title: 'Via Email'
					}
				]
			},
			{
				title: "Every reactivate action",
				name: "reactivateAction",
				description: "",
				list: [
					{
						name: 'reactivateInApp',
						title: 'In App'
					},
					{
						name: 'reactivateSMS',
						title: 'Via SMS'
					},
					{
						name: 'reactivateEmail',
						title: 'Via Email'
					}
				]
			},
			{
				title: "Every delete action",
				name: "deleteAction",
				description: "",
				list: [
					{
						name: 'deleteInApp',
						title: 'In App'
					},
					{
						name: 'deleteSMS',
						title: 'Via SMS'
					},
					{
						name: 'deleteEmail',
						title: 'Via Email'
					}
				]
			},
			{
				title: "Every payment action",
				name: "paymentAction",
				description: "",
				list: [
					{
						name: 'paymentInApp',
						title: 'In App'
					},
					{
						name: 'paymentSMS',
						title: 'Via SMS'
					},
					{
						name: 'paymentEmail',
						title: 'Via Email'
					}
				]
			},
			{
				title: "Every system action",
				name: "systemAction",
				description: "",
				list: [
					{
						name: 'systemInApp',
						title: 'In App'
					},
					{
						name: 'systemSMS',
						title: 'Via SMS'
					},
					{
						name: 'systemEmail',
						title: 'Via Email'
					}
				]
			},
			{
				title: "Every chat action",
				name: "chatAlert",
				description: "",
				list: [
					{
						name: 'chatInApp',
						title: 'In App'
					},
					{
						name: 'emailSMS',
						title: 'Via SMS'
					},
					{
						name: 'emailEmail',
						title: 'Via Email'
					}
				]
			}
        ]
    }
}

export default NotificationSettings

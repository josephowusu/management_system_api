import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import NotificationSettings from "../../../models/mainApp/default/NotificationSettingsTable"
import NotificationTable from "../../../models/mainApp/default/NotificationTable"
import { iNotificationSettingsUpdatableColumns } from "../../../modules/interfaces/default/iNotificationSettings"


interface socketBody {
    notificationID?:string|number
    columnName?:iNotificationSettingsUpdatableColumns
    value?:boolean
    status?:'all'|'read'|'unread'
    limit?:number
    offset:number
    macAddress?:string
    schemaName?:string
    sessionID?:number|string
}

const NotificationController = async (
        controllerType:'changeSettings'|'fetchUserNotification'|'settingsList'|'markAsRead'|'setDefaultSettings', 
        socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback
    ) => {
    if ( !body.macAddress || !body.schemaName){
        callback({status: "error", message: "Missing important parameter. Contact system administrator for support!"})
        return
    }

    const isSession = await authenticateSession(socket, database, body.macAddress ? body.macAddress : '', body.schemaName ? body.schemaName : '', body.sessionID ? body.sessionID : '')

    if (isSession.type === 'success') {
        const userID = isSession.data?.userID ? isSession.data?.userID : 0
        const schemaName = body.schemaName ? body.schemaName : ''

        if (controllerType === 'changeSettings') {

            let result = await changeNotificationSettings(database, schemaName, userID, body)
            callback({ status: result })

        } else if (controllerType === 'fetchUserNotification') {
            
            let result = await fetchUserNotification(database, schemaName, userID, body)
            callback(result)

        } else if (controllerType === 'settingsList') {
            
            let result = await fetchList(database, schemaName)
            callback(result)

        } else if (controllerType === 'setDefaultSettings') {
            
            let result = await insertDefaultNotificationSetting(database, schemaName, userID)
            callback({ status: result ? 'success' : 'error' })
            

        } else if (controllerType === 'markAsRead') {
            
            let result = await markNotificationAsRead(database, schemaName, userID, body)
            callback(result)

        }
    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}

async function markNotificationAsRead(database:MySQL.Connection|null, schemaName:string, userID:string|number, body:socketBody) {
    let response = {status: 'error'}
    const notification = new NotificationTable(undefined, database, schemaName)
    if (body.notificationID) {
        let result = await notification.getAll(1, 0, body.notificationID)
        if (Array.isArray(result) && result.length) {
            const readList = JSON.parse(result[0].readList ? result[0].readList : '[]')
            readList.push(userID)
            notification.setValues({
                id: Number(body.notificationID),
                readList: JSON.stringify(readList)
            })
            let saveResult = await notification.update(['readList'])
            response.status = saveResult
        }
    }

    return response
}


async function changeNotificationSettings(database:MySQL.Connection|null, schemaName:string, userID:string|number, body:socketBody) {
    const notificationSettings = new NotificationSettings(undefined, database, schemaName)

    let notificationSettingsID = await insertDefaultNotificationSetting(database, schemaName, userID)

    if (notificationSettingsID && body.columnName) {
        const values:any = {}
        values[body.columnName] = body.value ? 'yes' : 'no'

        notificationSettings.setValues({id: notificationSettingsID, ...values})
        let result = await notificationSettings.update([body.columnName])
        return result
    }
}


async function insertDefaultNotificationSetting(database:MySQL.Connection|null, schemaName:string, userID:string|number) {
    if (userID) {
        let notificationSettingsID = await isUserHasNotificationSettings(database, schemaName, userID)
        if (!notificationSettingsID) {
            const notificationSettings = new NotificationSettings(undefined, database, schemaName)
            notificationSettings.setValues({
                userID: userID,
                systemInApp: 'yes',
                systemEmail: 'yes'
            })
        
            let result = await notificationSettings.save()
            return result.type == 'success' ? result.primaryKey : false
        } else {
            return notificationSettingsID
        }
    } else {
        return false
    }
}


async function isUserHasNotificationSettings(database:MySQL.Connection|null, schemaName:string, userID:string|number) {
    const notificationSettings = new NotificationSettings(undefined, database, schemaName)
    let result = await notificationSettings.get('userID = ?', [userID], 1, 0)
    return Array.isArray(result) && result.length ? result[0].id : false
}


async function fetchUserNotification(database:MySQL.Connection|null, schemaName:string, userID:string|number, body:socketBody) {
    const notification = new NotificationTable(undefined, database, schemaName)
    let { limit, offset, status } = body
    limit = limit ? limit : 10
    offset = offset ? offset : 0
    let queryStatus:any = status

    const result = await notification.get(limit, offset, queryStatus, userID)
    console.log(result)
    return result
}


async function fetchList(database:MySQL.Connection|null, schemaName:string) {
    const notificationSettings = new NotificationSettings(undefined, database, schemaName)
    return notificationSettings.columnsList()
}


export default NotificationController
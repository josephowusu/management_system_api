import MySQL from "mysql"
import { Socket } from "socket.io"
import { iAlertType } from "./interfaces/default/iNotificationTable"
import NotificationTable from "../models/mainApp/default/NotificationTable"
import UserTable from "../models/mainApp/default/UserTable"
import { getAllPrivilegeModels, iPrivilegeTableNames } from "./PrivilegeModules"
import NotificationSettings from "../models/mainApp/default/NotificationSettingsTable"
import Logger from "./Logger"



const Notifier = async (
        dataBase:MySQL.Connection, socket:Socket, schemaName:string,
        sessionID:string|number, senderUserID:string|number,
        mainTableID:string|number, mainTableName:string, title:string, message:string, alertType:iAlertType,
        privilegeModelName?:iPrivilegeTableNames, privilegeColumnName?:string,
        receiverUserID?:string[]|number[]
    ) => {
        try {
            const notificationSettings = new NotificationSettings(undefined, dataBase, schemaName)
            const userTable = new UserTable(undefined, dataBase, schemaName)
            let senderInfo:any = await userTable.get(`user.id = ?`, [senderUserID], 1, 0)
            senderInfo = senderInfo.length ? senderInfo[0] : {}

            const saveNotification = async (userIdList:string[]|number[], readList:string[]|number[] = []) => {

                    const notification = new NotificationTable(undefined, dataBase, schemaName)
                    notification.setValues({
                        title: title,
                        message: message,
                        type: alertType,
                        usersList: JSON.stringify(userIdList),
                        readList: JSON.stringify(readList),
                        mainTableID: mainTableID,
                        mainTableName: mainTableName,
                        sessionID: sessionID
                    })
                    
                    let result = await notification.save()
                    return result
            }

            const sendMessage = (receiverUserID:string|number, notificationID:string|number, createdAt:string) => {
                socket.broadcast.emit(`systemNotification_${schemaName}_${receiverUserID}`, {
                    id: notificationID, 
                    title, 
                    message, 
                    type: alertType,
                    status: 'unread',
                    mainTableID,
                    mainTableName,
                    username: senderInfo && senderInfo.username ? senderInfo.username : '',
                    firstName: senderInfo && senderInfo.firstName ? senderInfo.firstName : '',
                    otherName: senderInfo && senderInfo.otherName ? senderInfo.otherName : '',
                    lastName: senderInfo && senderInfo.lastName ? senderInfo.lastName : '',
                    date_time: createdAt
                })
            }

            if (receiverUserID && receiverUserID.length) {
                let result = await saveNotification(receiverUserID, [])
                if (result.type == 'success' && result.primaryKey) {
                    for (let i = 0; i < receiverUserID.length; i++) {
                        sendMessage(receiverUserID[i], result.primaryKey, result.createdAt)
                    }
                }
                return
            }


            if (privilegeModelName && privilegeColumnName) {
                const privilege:any = getAllPrivilegeModels(dataBase, schemaName, privilegeModelName)

                if (privilege) {
                    let result = await privilege.get(`${privilegeColumnName} = ?`, ['yes'], 10000, 0)
                    let userIDs = []
                    if (Array.isArray(result) && result.length) {
                        for (let i = 0; i < result.length; i++) {
                            if (result[i].userID != senderUserID) {
                                let notifySettings:any = await notificationSettings.get(`userID = ?`, [result[i].userID], 1, 0)
                                notifySettings = Array.isArray(notifySettings) && notifySettings.length ? notifySettings[0] : {}
    
                                if (alertType == 'systemAction' || alertType == 'paymentAction' || alertType == 'chatAlert') {
                                    userIDs.push(result[i].userID)
                                } else {
                                    if (notifySettings && notifySettings.id) {
                                        if (checkNotificationSetting(notifySettings)) userIDs.push(result[i].userID)
                                    }
                                }
                            }
                        }
                    }

                    result = await saveNotification(userIDs, [])
                    if (result.type == 'success' && result.primaryKey) {
                        for (let i = 0; i < userIDs.length; i++) {
                            sendMessage(userIDs[i], result.primaryKey, result.createdAt)
                        }
                    }
                }
            }

            return
        } catch (error:any) {
            Logger.log('error', 'Notifier.ts', `An error stopped notification: ${error.message}`)
        }
}


const checkNotificationSetting = (notifySettingsObject:any) => {
    let result = false
    for (const key in notifySettingsObject) {
        if (notifySettingsObject[key] && notifySettingsObject[key] == 'yes') {
            result = true
            break
        }
    }

    return result
}


export default Notifier

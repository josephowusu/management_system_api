import MySQL from "mysql"
import { Socket } from "socket.io"
import { iAuthenticateBody, iFileUploaderData, iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import ServiceController from "../../controllers/mainApp/default/ServiceController"
import DepartmentController from "../../controllers/mainApp/default/DepartmentController"
import EmployeeController from "../../controllers/mainApp/default/EmployeeController"
import AuthenticateController from "../../controllers/mainApp/default/AuthenticateController"
import FileUploaderController from "../../controllers/mainApp/default/FileUploaderController"
import AppPackagesController from "../../controllers/mainApp/default/AppPackagesController"
import UserController from "../../controllers/mainApp/default/UserController"
import PrivilegeController from "../../controllers/mainApp/default/PrivilegeController"
import LogOutController from "../../controllers/loginAndRegistration/LogoutController"
import NotificationController from "../../controllers/mainApp/default/NotificationController"

const DefaultRoutes = (socket:Socket, database:MySQL.Connection|null) => {
    
    socket.on('/authenticate', async (body:iAuthenticateBody, callback:iSocketCallback) => {
        AuthenticateController(socket, database, body, callback)
    })

    socket.on('/upload-file', async (body:iFileUploaderData, callback:iSocketCallback) => {
        FileUploaderController(body, 'socket', callback, undefined)
    })

    socket.on('/app-packages', async (body:any, callback:iSocketCallback) => {
        AppPackagesController('filter', socket, database, body, callback)
    })

    socket.on('/my-packages', async (body:any, callback:iSocketCallback) => {
        AppPackagesController('myPackages', socket, database, body, callback)
    })

    socket.on('/buy-package', async (body:any, callback:iSocketCallback) => {
        AppPackagesController('purchase', socket, database, body, callback)
    })

    socket.on('/fetch-privileges', async (body:any, callback:iSocketCallback) => {
        PrivilegeController('fetch', socket, database, body, callback)
    })

    socket.on('/fetch-users', async (body:any, callback:iSocketCallback) => {
        UserController('fetch', socket, database, body, callback)
    })

    socket.on('/insert-update-Privilege', async (body:any, callback:iSocketCallback) => {
        PrivilegeController('insert/update', socket, database, body, callback)
    })

    socket.on('/user-privileges', async (body:any, callback:iSocketCallback) => {
        PrivilegeController('userPrivileges', socket, database, body, callback)
    })

    socket.on('/user-profile', async (body:any, callback:iSocketCallback) => {
        UserController('profile', socket, database, body, callback)
    })

    socket.on("/logout", (body:any, callback:iSocketCallback)=>{
        LogOutController('logout', socket, database, body, callback)
    })

    socket.on('/user/insertUpdate', async (body:any, callback:iSocketCallback) => {
        UserController('insert/update', socket, database, body, callback)
    })

    socket.on('/check-user', async (body:any, callback:iSocketCallback) => {
        UserController('checkUser', socket, database, body, callback)
    })

    socket.on('/set-default-notification-settings', async (body:any, callback:iSocketCallback) => {
        /**
         * No body
         */
        NotificationController('setDefaultSettings', socket, database, body, callback)
    })

    socket.on('/set-notification-settings', async (body:any, callback:iSocketCallback) => {
        /**
         * Body (columnName, value)
         */
        NotificationController('changeSettings', socket, database, body, callback)
    })

    socket.on('/fetch-notifications', async (body:any, callback:iSocketCallback) => {
        /**
         * Body (limit, offset, status:'all'|'read'|'unread')
         */
        NotificationController('fetchUserNotification', socket, database, body, callback)
    })

    socket.on('/fetch-notification-settings-list', async (body:any, callback:iSocketCallback) => {
        /**
         * No body
         */
        NotificationController('settingsList', socket, database, body, callback)
    })

    socket.on('/mark-notification-as-read', async (body:any, callback:iSocketCallback) => {
        /**
         * Body (notificationID)
         */
        NotificationController('markAsRead', socket, database, body, callback)
    })

    socket.on("/service/insertUpdate", (body, callback:iSocketCallback) => {
        ServiceController("insert/update", socket, database, body, callback)
    })

    socket.on("/service/fetch", (body, callback:iSocketCallback) => {
        ServiceController("fetch", socket, database, body, callback)
    })

    socket.on("/department/insertUpdate", (body, callback:iSocketCallback) => {
        DepartmentController("insert/update", socket, database, body, callback)
    })

    socket.on("/department/fetch", (body, callback:iSocketCallback) => {
        DepartmentController("fetch", socket, database, body, callback)
    })

    socket.on("/employee/insertUpdate", (body, callback:iSocketCallback) => {
        EmployeeController("insert/update", socket, database, body, callback)
    })

    socket.on("/employee/fetch", (body, callback:iSocketCallback) => {
        EmployeeController("fetch", socket, database, body, callback)
    })

}

export default DefaultRoutes
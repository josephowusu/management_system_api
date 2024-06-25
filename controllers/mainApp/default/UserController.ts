import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "./AuthenticateController"
import UserTable from "../../../models/mainApp/default/UserTable"
import md5 from "md5"
import Notifier from "../../../modules/Notifier"
import BusinessTable from "../../../models/core/BusinessTable"

interface socketBody {
    userID?:number|string
    employeeID?:number
    username?:string
    password?:string
    oldPassword?:string
    newPassword?:string
    update?:boolean
    macAddress?:string
    schemaName?:string
    hiddenUserID?:string|number
    sessionID?:number|string
}

const UserController = async (controllerType:'insert/update'|'fetch'|'profile'|'checkUser', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
    if ( !body.macAddress || !body.schemaName){
        callback({status: "error", message: "Missing important parameter. Contact system administrator for support!"})
        return
    }

    const isSession = await authenticateSession(socket, database, body.macAddress ? body.macAddress : '', body.schemaName ? body.schemaName : '', body.sessionID ? body.sessionID : '')

    if (isSession.type === 'success') {
        const userID = isSession.data?.userID ? isSession.data?.userID : 0
        const businessCode = isSession.data?.businessCode ? isSession.data?.businessCode : 'null'
        const schemaName = body.schemaName ? body.schemaName : ''
        let privileges:iPrivileges = {}
        if (database) {
            privileges = await fetchPrivileges(userID, businessCode, schemaName, database)
        }

        if (controllerType === 'fetch') {
            if (privileges.Default?.addNewUser == 'yes' || 
            privileges.Default?.updateExistingUser == 'yes' || 
            privileges.Default?.deactivateExistingUser == 'yes' ||
            privileges.Default?.deleteExistingUser == 'yes') {
                getUsers(socket, database, body, callback)
            } else {
                callback({
                    status: 'warning',
                    message: 'You have no privilege to perform this task!'
                })
            }
        } else if (controllerType === 'profile') {

            getProfile(socket, database, body, callback, userID)

        } else if (controllerType === 'insert/update') {
            if (body.update === true) {
                if ( privileges.Default?.updateExistingUser == 'yes' ) {
                    updatePassword(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.Default?.addNewUser == 'yes') {
                    addNewUser(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }
        } else if (controllerType === 'checkUser') {
            userCheck(socket, database, body, callback)
        }

    } else {

        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
        
    }
}


async function userCheck(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any){
    const {employeeID, schemaName} = body
    const userTable = new UserTable(undefined, database, schemaName)
    const checker = await userTable.get("user.employeeID = ?",[employeeID], 1, 0)
    if (checker.length > 0) {

        callback({
            status: 'exists',
            data: {username: checker[0].username},
            message: 'This employee already has a user login'
        })

    } else {
        callback({
            status: 'error',
            message: 'employee does not have a user login'
        })
    }
}

async function addNewUser(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {employeeID, username, password, schemaName, sessionID} = body

    if(!username || !password) {
        callback({
            status: "error",
            message: "some fields are required"
        })
        return
    }

    const userTable = new UserTable(undefined, database, schemaName)

    const checker = await userTable.get("employeeID = ? and username = ?",[employeeID, username], 1, 0)

    if (checker.length > 0) {
        callback({
            status: "exists",
            message: "An employee with same username exists!"
        })
        return
    } else { 
        userTable.setValues({
            employeeID: Number(employeeID),
            username: username,
            password:  md5(password),
            sessionID: sessionID ? Number(sessionID) : null,
        })

        const savedUserLogin = await userTable.save()

        if (savedUserLogin.type === 'success') {
            if (database && schemaName && sessionID && savedUserLogin.primaryKey) {
                Notifier(database, socket, schemaName, sessionID, userID, savedUserLogin.primaryKey, 'user', "added a new user", "added user @"+ username, 'newInsertAction', 'defaultPrivilege', 'addNewUser')
            }
            callback({
                status: "success",
                message: "User account has been created Successfully!"
            })
            socket.broadcast.emit(schemaName+'/user/insertUpdate', 'success')
            socket.emit(schemaName+'/user/insertUpdate', 'success')
        } else {
            callback({
                status: "error",
                message: "Failed to create new user!"
            })
        }
    }
}

async function updatePassword(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {employeeID, username, password, schemaName, sessionID} = body

    if(!username || !password) {
        callback({
            status: "error",
            message: "some fields are required"
        })
        return
    }

    const userTable = new UserTable(undefined, database, schemaName)
    const checker = await userTable.get("user.username = ? and user.employeeID = ?",[username, employeeID], 1, 0)
    
    if (checker.length > 0) {
        userTable.setValues({
            id: checker[0].id,
            password:  md5(password)
        })
        const updatedUserLogin = await userTable.update(["password"])
        if ( updatedUserLogin == "success" ) {
            if (database && schemaName && sessionID && checker[0].id) {
                Notifier(database, socket, schemaName, sessionID, userID, checker[0].id, 'user', "updated an existing user", "updated user", 'updateAction', 'defaultPrivilege', 'updateExistingUser')
            }
            callback({
                status: "success",
                message: "Password updated Successfully"
            })
            socket.broadcast.emit(schemaName+'/user/insertUpdate', 'success')
            socket.emit(schemaName+'/user/insertUpdate', 'success')
        } else {
            callback({
                status: "error",
                message: 'Failed to update user'
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid user"
        })
    }
}

async function changePassword(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {employeeID, oldPassword, newPassword, schemaName, sessionID} = body

    if(!oldPassword || !newPassword) {
        callback({
            status: "error",
            message: "some fields are required"
        })
        return
    }

    const userTable = new UserTable(undefined, database, schemaName)
    const checker = await userTable.get("user.employeeID = ?",[employeeID], 1, 0)
    
    if (checker.length > 0) {
        userTable.setValues({
            id: checker[0].id,
            password:  md5(newPassword)
        })
        const updatedUserLogin = await userTable.update(["password"])
        if ( updatedUserLogin == "success" ) {
            if (database && schemaName && sessionID && checker[0].id) {
                Notifier(database, socket, schemaName, sessionID, userID, checker[0].id, 'user', "updated an existing user", "updated user", 'updateAction', 'defaultPrivilege', 'updateExistingUser')
            }
            callback({
                status: "success",
                message: "Password updated Successfully"
            })
            socket.broadcast.emit(schemaName+'/user/insertUpdate', 'success')
            socket.emit(schemaName+'/user/insertUpdate', 'success')
        } else {
            callback({
                status: "error",
                message: 'Failed to update user'
            })
        }
    } else {
        callback({
            status: "error",
            message: "Cannot update invalid user"
        })
    }
}

async function getProfile(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const { schemaName } = body
    
    const user = new UserTable(undefined, database, schemaName)
    const business = new BusinessTable(undefined, database, schemaName)
    const uniqueCode = schemaName ? schemaName.split("_")[1] : null
    const checkCompany = await business.get("uniqueCode = ?", [uniqueCode], 1, 0)
    const userDetails = await user.get("user.id = ?", [userID], 1, 0)
    checkCompany.length ? userDetails[0]['companyName'] = checkCompany[0].name : userDetails
    if (userDetails.length > 0) {
        callback({
            status: "success",
            data: userDetails
        })
    } else {
        callback({
            status: "empty",
            message: "Couldn't find any data on user !"
        })
    }
}

async function getUsers(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    const { schemaName } = body
    const user = new UserTable(undefined, database, schemaName)
    const allUsers = await user.getAll(10, 0)
    if ( allUsers.length > 0) {
        callback({
            status: "success",
            data: allUsers
        })
    } else {
        callback({
            status: "empty",
            message: "User list is empty!"
        })
    }
}

export default UserController
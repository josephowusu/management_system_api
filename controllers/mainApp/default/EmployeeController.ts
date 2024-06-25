import MySQL from "mysql"
import { Socket } from "socket.io"
import AddressTable from "../../../models/mainApp/default/AddressTable"
import BusinessTable from "../../../models/mainApp/default/BusinessTable"
import ContactTable from "../../../models/mainApp/default/ContactTable"
import PersonTable from "../../../models/mainApp/default/PersonTable"
import { arrangeName, authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import EmployeeTable from "../../../models/mainApp/default/EmployeeTable"
import BankTable from "../../../models/mainApp/default/BankTable"
import EmployeeBankTable from "../../../models/mainApp/default/EmployeeBankTable"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "./AuthenticateController"
import Notifier from "../../../modules/Notifier"

interface socketBody {
    employeeName?:string
    employeePhone?:string
    employeeEmail?:string
    employeeGender?:string
    employeeAddress?:string
    employeeDigitalAddress?:string
    employeeDOB?:string
    employeeDepartmentID?:number
    employeeRole?:string
    bankOrNetworkName?:string
    accountName?:string
    accountNumber?:number|string
    hiddenEmployeeID?:number|string
    schemaName:string
    macAddress:string
    sessionID?:number|string
}

const EmployeeController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

        if (controllerType === 'insert/update') {
            if (body.hiddenEmployeeID) {
                if (privileges.Default?.updateExistingEmployee == 'yes') {
                    updateEmployee(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            } else {
                if (privileges.Default?.addNewEmployee == 'yes') {
                    addEmployee(socket, database, body, callback, userID)
                } else {
                    callback({
                        status: 'warning',
                        message: 'You have no privilege to perform this task!'
                    })
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.Default?.addNewEmployee == 'yes' || 
            privileges.Default?.updateExistingEmployee == 'yes' || 
            privileges.Default?.deactivateExistingEmployee == 'yes' ||
            privileges.Default?.deleteExistingEmployee == 'yes') {
                getEmployee(socket, database, body, callback)
            } else {
                callback({
                    status: 'warning',
                    message: 'You have no privilege to perform this task!'
                })
            } 
        }

    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}

async function updateEmployee(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    const {hiddenEmployeeID, employeeName, employeePhone, employeeEmail, employeeGender, employeeAddress, employeeDigitalAddress, employeeDOB, employeeDepartmentID, employeeRole, bankOrNetworkName, accountName, accountNumber, schemaName, sessionID} = body
    
    const personTable = new PersonTable(undefined, database, schemaName)
    const employeeTable = new EmployeeTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)
    const bankTable = new BankTable(undefined, database, schemaName)
    const EmployeeBankAccount = new EmployeeBankTable(undefined, database, schemaName)

    const checker = await employeeTable.get("employee.id = ?", [hiddenEmployeeID], 1, 0)
    
    if (checker.length > 0) {
        const employeeNameArrangeResult = await arrangeName(employeeName ? employeeName : '')
        console.log(checker[0].personID)
        personTable.setValues({
            id: checker[0].personID,
            firstName: employeeNameArrangeResult.first,
            otherName: employeeNameArrangeResult.other,
            lastName: employeeNameArrangeResult.last,
            gender: employeeGender,
            dateOfBirth: employeeDOB,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const personUpdate = await personTable.update(["firstName","otherName","lastName","gender","dateOfBirth"])
        const personUpdateResult = {type: personUpdate, primaryKey: checker[0].personID}
        
        contactTable.setValues({
            id: checker[0].contactID,
            phone: employeePhone,
            mobile: undefined,
            email: employeeEmail,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactUpdate = await contactTable.update(["phone","email"])
        const contactUpdateResult = {type: contactUpdate, primaryKey: checker[0].contactID}

        addressTable.setValues({
            id: checker[0].addressID,
            postalAddress: employeeAddress,
            digitalAddress: employeeDigitalAddress,
            location: undefined,
            landMark:  undefined,
            geoLatitude: undefined,
            geoLongitude: undefined,
            country: undefined,
            stateOrRegion: undefined,
            cityOrTown: undefined,
            suburb: undefined,
        })
        const addressUpdate = await addressTable.update(["postalAddress","digitalAddress"])
        const addressUpdateResult = {type: addressUpdate, primaryKey: checker[0].addressID}
        
        let employeeBankSaveResult
        if (bankOrNetworkName !== "") {

            const checkBank = await bankTable.get("name = ?", [bankOrNetworkName], 1, 0)

            if (checker[0].employeeBankID) { 
                if (checkBank.length > 0) {
                    EmployeeBankAccount.setValues({
                        id: checker[0].employeeBankID,
                        bankID: checkBank[0].id,
                        accountNumber: accountNumber,
                        accountName: accountName,
                    })
    
                    const updateResult = await EmployeeBankAccount.update(["bankID","accountNumber","accountName"])
                    employeeBankSaveResult = {type: updateResult, primaryKey: checker[0].employeeBankID}
                } else {
                    bankTable.setValues({
                        name: bankOrNetworkName,
                        sessionID: sessionID
                    })
                    
                    const bankSaveResult = await bankTable.save()
    
                    EmployeeBankAccount.setValues({
                        id: checker[0].employeeBankID,
                        bankID: bankSaveResult.type === "success" ? bankSaveResult.primaryKey : null,
                        accountNumber: accountNumber,
                        accountName: accountName,
                    })
                    const updateResult = await EmployeeBankAccount.update(["bankID","accountNumber","accountName"])
                    employeeBankSaveResult = {type: updateResult, primaryKey: checker[0].employeeBankID}
                }
            } else {
                if (checkBank.length > 0) {
                    EmployeeBankAccount.setValues({
                        bankID: checkBank[0].id,
                        accountNumber: accountNumber,
                        accountName: accountName,
                        sessionID: sessionID
                    })
    
                    employeeBankSaveResult = await EmployeeBankAccount.save()
                } else {
                    
                    bankTable.setValues({
                        name: bankOrNetworkName,
                        sessionID: sessionID
                    })
                    
                    const bankSaveResult = await bankTable.save()
    
                    EmployeeBankAccount.setValues({
                        bankID: bankSaveResult.type === "success" ? bankSaveResult.primaryKey : null,
                        accountNumber: accountNumber,
                        accountName: accountName,
                        sessionID: sessionID
                    })

                    employeeBankSaveResult = await EmployeeBankAccount.save()
                }
            }
        }
        
        employeeTable.setValues({
            id: checker[0].id,
            personID: personUpdateResult.type === 'success' ? personUpdateResult.primaryKey : null,
            contactID: contactUpdateResult.type === 'success' ? contactUpdateResult.primaryKey : null,
            addressID: addressUpdateResult.type === 'success' ? addressUpdateResult.primaryKey : null,
            departmentID: employeeDepartmentID,
            role: employeeRole,
            employeeBankID: employeeBankSaveResult?.type === 'success' ? employeeBankSaveResult.primaryKey : null,
        })

        const employeeSaveResult = await employeeTable.update(["personID","contactID","addressID","departmentID","role","employeeBankID"])
        
        if ( employeeSaveResult == "success" ) {
            if (database && schemaName && sessionID && checker[0].id) {
                Notifier(database, socket, schemaName, sessionID, userID, checker[0].id, 'employee', "updated an employee", `updated an existing employee's details`, 'updateAction', 'defaultPrivilege', 'updateExistingEmployee')
            }
            callback({
                status: 'success',
                message: 'Employee has been updated successfully!',
            })
            socket.broadcast.emit(schemaName+'/employee/insertUpdate', 'success')
            socket.emit(schemaName+'/employee/insertUpdate', 'success')
        } else {

            callback({
                status: 'error',
                message: 'Failed to update employee',
            })
        }
    } else {
        console.log({
            status: "error",
            message: "Cannot update invalid employee"
        })
    }
}

async function addEmployee(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any, userID:string|number) {
    
    const {employeeName, employeePhone, employeeEmail, employeeGender, employeeAddress, employeeDigitalAddress, employeeDOB, employeeDepartmentID, employeeRole, bankOrNetworkName, accountName, accountNumber, schemaName, sessionID} = body
        
    const personTable = new PersonTable(undefined, database, schemaName)
    const employeeTable = new EmployeeTable(undefined, database, schemaName)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)
    const bankTable = new BankTable(undefined, database, schemaName)
    const EmployeeBankAccount = new EmployeeBankTable(undefined, database, schemaName)
    
    const employeeSearchResult = await employeeTable.get("CONCAT(IFNULL(person.firstName, ''), ' ' ,IFNULL(person.otherName, ''), ' ' ,IFNULL(person.lastName, '')) = ? AND contact.phone = ? ", [employeeName, employeePhone], 1, 0)
    
    //returns Client already exists if client exists
    if (employeeSearchResult.length > 0) {
        callback({ 
            status: "exists", 
            message: "Employee already exists" 
        })
        return

    } else {

        const employeeNameArrangeResult = await arrangeName(employeeName ? employeeName : '')
        
        personTable.setValues({
            firstName: employeeNameArrangeResult.first,
            otherName: employeeNameArrangeResult.other,
            lastName: employeeNameArrangeResult.last,
            gender: employeeGender,
            dateOfBirth: employeeDOB,
            maritalStatus: undefined,
            placeOfBirth: undefined,
            nationality: undefined,
            nationalIdNumber: undefined,
            socialSecurityNumber: undefined,
        })
        const personSaveResult = await personTable.save()
        console.log(personSaveResult)
            

        contactTable.setValues({
            phone: employeePhone,
            mobile: undefined,
            email: employeeEmail,
            alternativeEmail: undefined,
            website: undefined,
            socialLinks: undefined,
        })
        const contactSaveResult = await contactTable.save()

        
        addressTable.setValues({
            postalAddress: employeeAddress,
            digitalAddress: employeeDigitalAddress,
            location: undefined,
            landMark:  undefined,
            geoLatitude: undefined,
            geoLongitude: undefined,
            country: undefined,
            stateOrRegion: undefined,
            cityOrTown: undefined,
            suburb: undefined,
        })
        const addressSaveResult = await addressTable.save()

        let employeeBankSaveResult
        if (bankOrNetworkName !== "") {

            const checkBank = await bankTable.get("name = ?", [bankOrNetworkName], 1, 0)

            if (checkBank.length > 0) {

                EmployeeBankAccount.setValues({
                    bankID: checkBank[0].id,
                    accountNumber: accountNumber,
                    accountName: accountName,
                    sessionID: sessionID
                })

                employeeBankSaveResult = await EmployeeBankAccount.save()
                
            }else {
                
                bankTable.setValues({
                    name: bankOrNetworkName,
                    sessionID: sessionID
                })
                const bankSaveResult = await bankTable.save()

                EmployeeBankAccount.setValues({
                    bankID: bankSaveResult.type === "success" ? bankSaveResult.primaryKey : null,
                    accountNumber: accountNumber,
                    accountName: accountName,
                    sessionID: sessionID
                })
                employeeBankSaveResult = await EmployeeBankAccount.save()
            }
        }

        employeeTable.setValues({
            personID: personSaveResult.type === 'success' ? personSaveResult.primaryKey : null,
            contactID: contactSaveResult.type === 'success' ? contactSaveResult.primaryKey : null,
            addressID: addressSaveResult.type === 'success' ? addressSaveResult.primaryKey : null,
            departmentID: employeeDepartmentID,
            role: employeeRole,
            employeeBankID: employeeBankSaveResult?.type === 'success' ? employeeBankSaveResult.primaryKey : null,
            sessionID: sessionID
        })

        const employeeSaveResult = await employeeTable.save()

        if ( employeeSaveResult.type == "success" ) {
            if (database && schemaName && sessionID && employeeSaveResult.primaryKey) {
                Notifier(database, socket, schemaName, sessionID, userID, employeeSaveResult.primaryKey, 'employee', "added a new employee", `added a new employee ${employeeNameArrangeResult.first} ${employeeNameArrangeResult.other ? employeeNameArrangeResult.other : null} ${employeeNameArrangeResult.last}`, "newInsertAction", 'defaultPrivilege', 'addNewEmployee')
            }
            callback({
                status: 'success',
                message: 'Employee has been added successfully',
            })
            socket.broadcast.emit(schemaName+'/employee/insertUpdate', 'success')
            socket.emit(schemaName+'/employee/insertUpdate', 'success')
        } else {
            callback({
                status: 'error',
                message: 'Failed to add employee',
            })
        }
    }

}

async function getEmployee(socket:Socket, database:MySQL.Connection|null, body:any, callback:any) {
    
    const {schemaName, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found"
        })
        return
    }

    const employee = new EmployeeTable(undefined, database, schemaName)

    const allEmployee = await employee.getAll(10, 0)
    
    if ( allEmployee.length > 0) {
        
        callback({
            status: "success",
            data: allEmployee
        })


    } else {

        callback({
            status: "empty",
            message: "Employee list is empty"
        })

    }

}

export default EmployeeController
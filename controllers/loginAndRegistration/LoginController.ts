import Express from 'express'
import MySQL from 'mysql'
import { iControllerResponse } from '../../modules/interfaces/IGeneralInterface'
import BusinessDatabaseTable from '../../models/core/BusinessDatabaseTable'
import UserTable from '../../models/mainApp/default/UserTable'
import md5 from 'md5'
import SessionTable from '../../models/mainApp/default/SessionTable'
import { fullDateTime, generateSessionToken } from '../../modules/GeneralModules'
import DatabaseMigration from '../../models/general/DatabaseMigration'
import { CustomerRelationshipManagementModelList, InventoryModelList } from '../../models/list/AppFeaturesModelList'
import BusinessTable from '../../models/core/BusinessTable'

interface requestBody {
    businessID?:string
    macAddress?:string
    username?:string
    password?:string
}

const LoginController = async (database:MySQL.Connection|null, request:Express.Request, response:Express.Response) => {

    //Get request body
    let data:requestBody = request.body

    const returnMessage:iControllerResponse = {status: '', message: ''}

    const businessDatabaseTable = new BusinessDatabaseTable(undefined, database, process.env.CORE_DB_NAME)
    
    //Check for schema name
    if (!data.businessID){
        response.json({
            status: "error",
            message: "Business ID is Required!"
        })
        return
    }

    //check if macAddress is added
    if (!data.macAddress){
        response.json({
            status: "error",
            message: "Missing important parameter. Contact system administrator for support!"
        })
        return
    }

    //check for required fields (username, password)
    if (!data.username || !data.password){
        response.json({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    //check if schema name exist
    const checkSchema = await businessDatabaseTable.get("business.uniqueCode = ?", [data.businessID], 1, 0)
    if (checkSchema.length > 0){
        const userTable = new UserTable(undefined, database, checkSchema[0].schemaName)
        const sessionTable = new SessionTable(undefined, database, checkSchema[0].schemaName)

        //query users table to check for username 
        const userSearchResult = await userTable.get("username = ?", [data.username], 1, 0)

        if (userSearchResult.length > 0) {
            //if username name exist, compare the result's password to the md5(form password)
            let userPassword = userSearchResult[0].password
            if (md5(data.password) === userPassword){
                //if all credentials are properly authenticated, create a session token
                const sessionToken = generateSessionToken(request, data.macAddress ? data.macAddress : '', checkSchema[0].schemaName)

                //insert into session table with session token
                sessionTable.setValues({
                    userID: userSearchResult[0].id ? userSearchResult[0].id : 0,
                    loginDateAndTime: fullDateTime(),
                    logoutDateAndTime: null,
                    token: sessionToken
                })
                const sessionSaveResult = await sessionTable.save()

                //response to client with schema name and session primary key
                returnMessage.status = 'success'
                returnMessage.message = 'Congratulations! You have successfully created your business account!'
                returnMessage.data = {
                    schema: checkSchema[0].schemaName, 
                    token: sessionSaveResult.type === 'success' ? sessionSaveResult.primaryKey : null,
                    businessID: checkSchema[0].uniqueCode,
                    businessName: checkSchema[0].name,
                    employeeID: userSearchResult[0].employeeID,
                    userID: userSearchResult[0].id ? userSearchResult[0].id : 0
                }

            } else {
                //if password does not match, message password is incorrect
                returnMessage.status = "error",
                returnMessage.message = "Password is incorrect"
            }
        } else {
            //if username does not exist, message username is incorrect
            returnMessage.status = "error",
            returnMessage.message = "Username is invalid"
        }
    } else {
        //if schema does not exist, message client as "Provide a valid business code"
        returnMessage.status = "error",
        returnMessage.message = "Provide a valid business code"
        
    }
    
    response.json(returnMessage)
    return
}

export default LoginController

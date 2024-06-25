import MySQL from "mysql"
import { Socket } from "socket.io"
import TierTable from "../../../models/mainApp/hr/TierTable"
import { authenticateSession } from "../../../modules/GeneralModules"
import { iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import { iPrivileges } from "../../../modules/interfaces/iPrivileges"
import { fetchPrivileges } from "../default/AuthenticateController"


interface socketBody {
    name?:string
    description?:string
    percentage?:string
    macAddress?:string
    schemaName?:string
    tierHiddenID?:number
    sessionID?:string|number
}

const TierController = async (controllerType:'insert/update'|'fetch', socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:iSocketCallback) => {
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

            if (body.tierHiddenID) {
                if (privileges.HR?.updateExistingTier == 'yes'){
                    updateTier(socket, database, body, callback)
                }

            } else{
                if (privileges.HR?.addNewTier == 'yes'){
                    addTier(socket, database, body, callback)
                }
            }
        } else if (controllerType === 'fetch') {
            if (privileges.HR?.addNewTier == 'yes' || 
            privileges.HR?.updateExistingTier == 'yes' || 
            privileges.HR?.deactivateExistingTier == 'yes' ||
            privileges.HR?.deleteExistingTier == 'yes') {
                getTier(socket, database, body, callback)
            }
        }
    } else {
        callback({
            status: 'sessionExpiry',
            message: 'Session has expired'
        })
    }
}

async function addTier(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const {name, description, percentage, macAddress, schemaName, sessionID} = body

    //check if name is empty
    if (!name || !percentage) {
        callback({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const tier = new TierTable()

    const checkTier = await tier.get("name = ?", [name], 1, 0)

    if(checkTier.length > 0) {

        callback({
            status: "exists",
            message: "Sorry, tier with the same name exist"
        })
        return

    }
    
    tier.setValues({
        name: name,
        percentage: percentage,
        description: description,
        sessionID: sessionID 
    })

    const tierSaveResult = await tier.save()

    if ( tierSaveResult.type == 'success' ) {

        callback({
            status: "success",
            message: "Tier has been created successfully"
        })

    } else {

        callback({
            status: "error",
            message: tierSaveResult
        })

    }
}

async function updateTier(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {
    
    const {name, description, percentage, macAddress, schemaName, tierHiddenID, sessionID } = body 

    //check if name is empty
    if (!name) {
        callback.status(200).json({
            status: "Empty",
            message: "Some fields are required!"
        })
        return
    }

    const tier = new TierTable()

    //updating service  
    tier.setValues({
        id: tierHiddenID,
        name: name,
        percentage: percentage,
        description: description,
        sessionID: sessionID 
    })

    const tierSaveResult = await tier.update(["name", "percentage", "description"])

    if ( tierSaveResult == "success" ) {

        callback.status(200).json({
            status: "success",
            message: "Tier added successfully"
        })

    } else {

        callback.status(200).json({
            status: "error",
            message: tierSaveResult
        })

    }

}

async function getTier(socket:Socket, database:MySQL.Connection|null, body:socketBody, callback:any) {

    const {macAddress, schemaName, sessionID} = body

    if ( !sessionID ) {
        callback({
            status: "error", 
            message: "sessionID wasn't found"
        })
        return
    }


    const tier = new TierTable(undefined, database, schemaName)

    const allTier = await tier.getAll(10, 0)

    if ( allTier.length > 0) {

        callback({
            status: "success",
            data: allTier
        })

    } else {

        callback({
            status: "empty",
            message: "Tier list is empty"
        })

    }

}


export default TierController
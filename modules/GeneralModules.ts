import MySql from 'mysql'
import Express from 'express'
import { iMySQLResponseObject } from './interfaces/iMigration'
import UserAgent from 'express-useragent'
import crypto from 'crypto'
import md5 from 'md5'
import path from 'path'
import axios from 'axios'
import dotenv from 'dotenv'
import { Socket } from 'socket.io'
import { iAuthenticateSessionResponse, iSessionToken } from './interfaces/IGeneralInterface'
import SessionTable from '../models/mainApp/default/SessionTable'
import Multer from "multer"
import BusinessDatabaseTable from '../models/core/BusinessDatabaseTable'
dotenv.config({ path: path.join(__dirname, `../env`)})

const storage = Multer.diskStorage({
    destination :'./../uploads',
    filename: (req, file, cb) => {
      cb(null, crypto.randomBytes(20).toString('hex') + '.jpeg');
    }
})

var upload = Multer({ 
    storage: storage 
})

export const verifyPayment = async (reference:string) => {
    const secret_key = 'sk_test_35f933a179440d9095dfb467a111862fe9184323'
    const url = `https://api.paystack.co/transaction/verify/${reference}`
    
    axios({
        method: 'get',
        url: url,
        headers: {
          Authorization: `Bearer ${secret_key}`,
          'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.data
    }).catch(error => {
        return error
    })

}

export const dbQuery = async (sql:string, columns:any[], database:MySql.Connection|null|undefined):Promise<any[]|iMySQLResponseObject|null> => {
    return new Promise((resolve, reject) => {
        let formattedSql = MySql.format(sql, columns)
        if (database) {
            database.query(formattedSql, (error, result) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(result)
                }
            })
        } else {
            resolve(null)
        }
    })
}

export const generateID = () => {
    return Number(shuffle(Date.now()))
}

export const generateStringID = (name:string) => {
    let idString = name ? name.split(' ').join('_').substring(0, 2) : ''
    let idNumber = generateID().toString().substring(0, 6)
    return idString+idNumber
}

export const shuffle = (value:string|number) => {
    let a = value.toString().split(""), n = a.length
    for (var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1))
        var tmp = a[i]
        a[i] = a[j]
        a[j] = tmp
    }
    return a.join("")
}

export const fullDateTime = (value?:string) => {
    let date
    if (value) {
        date = new Date(value)
    } else {
        date = new Date()
    }

    let dd:any = date.getUTCDate()
    dd = dd < 10 ? '0'+dd : dd

    let mm:any = date.getUTCMonth()+1
    mm = mm < 10 ? '0'+mm : mm

    let yyyy = date.getUTCFullYear()

    return yyyy+'-'+mm+'-'+dd+' '+date.getUTCHours()+':'+date.getUTCMinutes()+':'+date.getUTCSeconds()
}

export const fullDate = (value?:string) => {
    let date
    if (value) {
        date = new Date(value)
    } else {
        date = new Date()
    }

    let dd:any = date.getUTCDate()
    dd = dd < 10 ? '0'+dd : dd

    let mm:any = date.getUTCMonth()+1
    mm = mm < 10 ? '0'+mm : mm

    let yyyy = date.getUTCFullYear()

    return yyyy+'-'+mm+'-'+dd
}

export const getUpdateSqlStatement = (dataObject:any, columnsToUpdate:any[]) => {
    let sql = ' SET ', columns = []
    if (columnsToUpdate && columnsToUpdate.length > 0) {
        for (let i = 0; i < columnsToUpdate.length; i++) {
            const column = columnsToUpdate[i]
            sql += i === 0 ? ` ${column} = ?` : `, ${column} = ?`
            columns.push(dataObject[column])
        }
    }

    return {sql, columns}
}

export const generateSessionToken = (request:Express.Request, macAddress:string, schemaName:string) => {
    let ip:any = request.header('x-forwarded-for') || request.socket.remoteAddress
    let UA = UserAgent.parse(request.headers['user-agent'] ? request.headers['user-agent'] : '')

    let sessionData = JSON.stringify({
        ipAddress: ip,
        userAgent: UA,
        macAddress: macAddress,
        schema: schemaName
    })

    let encryptedText = encrypt(sessionData)

    return encryptedText
}

export const encrypt = (string:string) => {
    let key:any = process.env.SERVER_DECRYPT_KEY
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', md5(key), iv)
    let encrypted = cipher.update(string)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return `${iv.toString('hex')}***${encrypted.toString('hex')}`
}

export const decrypt = (encryptedString:string) => {
    let key:any = process.env.SERVER_DECRYPT_KEY
    let encryptedArray = encryptedString.split('***')
    const iv = Buffer.from(encryptedArray[0], 'hex')
    const encryptedText = Buffer.from(encryptedArray[1], 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', md5(key), iv)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}

export const authenticateSession = async (socket:Socket, database:MySql.Connection|null, macAddress:string, schemaName:string, sessionID:string|number):Promise<iAuthenticateSessionResponse> => {
    const sessionData:iSessionToken = {
        sessionID: sessionID,
        schema: schemaName,
        macAddress: macAddress,
        ipAddress: socket.handshake.address,
        userAgent: UserAgent.parse(socket.handshake.headers['user-agent'] ? socket.handshake.headers['user-agent'] : '')
    }
    const sessionTable = new SessionTable(undefined, database, sessionData.schema)
    
    let sessionResult = await sessionTable.get(`session.id = ? AND logoutDateAndTime IS NULL`, [sessionData.sessionID], 1, 0)
   
    if (Array.isArray(sessionResult) && sessionResult.length > 0) {
        let tokenString = sessionResult[0].token
        tokenString = decrypt(tokenString)
        let sessionToken:iSessionToken = JSON.parse(tokenString)
        
        if (sessionData.ipAddress === sessionToken.ipAddress && sessionData.macAddress === sessionToken.macAddress && JSON.stringify(sessionData.userAgent) === JSON.stringify(sessionToken.userAgent)) {
            const businessDatabases = new BusinessDatabaseTable(undefined, database, process.env.CORE_DB_NAME)
            let result = await businessDatabases.get(`businessDatabase.schemaName = ? AND businessDatabase.status = ?`, [sessionData.schema, 'active'], 1, 0)
            let businessCode = Array.isArray(result) && result.length ? result[0].uniqueCode : ''
            let businessID = Array.isArray(result) && result.length ? result[0].businessID : ''
            return {type: 'success', data: {businessID: businessID, businessCode: businessCode, userID: sessionResult[0].userID, privileges: null, sessionID: sessionResult[0].id}}
        } else {
            sessionTable.setValues({
                id: Number(sessionData.sessionID),
                logoutDateAndTime: fullDateTime(),
                logoutType: 'system',
                unauthorizedAccessData: JSON.stringify(sessionData)
            })
            await sessionTable.update(['logoutDateAndTime', 'logoutType', 'unauthorizedAccessData'])
            return {type: 'unauthorized', message: 'Your session has expired!'}
        }
        
    } else {
        return {type: 'invalid', message: 'Your session has expired.!'}
    }
}

export const arrangeName = async ( clientName: string ) => {
    let firstName = ""
    let lastName = ""
    let otherName = ""
    const nameScheme = clientName.trim().split(" ")
    const last = nameScheme.length - 1
    if (nameScheme.length === 2) {
        firstName = nameScheme[0]
        lastName = nameScheme[1]
        otherName = ' '
    } else if (nameScheme.length === 3) {
        firstName = nameScheme[0]
        otherName = nameScheme[1]
        lastName = nameScheme[2]
    } else if(nameScheme.length>3) {
        let other = ''
        for (let i = 1; i < last; i++){
            other += nameScheme[i]+' '
        }
        firstName = nameScheme[0]
        otherName = other.trim()
        lastName = nameScheme[nameScheme.length - 1]
    } else if (nameScheme.length === 1) {
        firstName = nameScheme[0]
        lastName = ' '
        otherName = ' '
    }

    return {first: firstName, other: otherName, last: lastName}
}


 
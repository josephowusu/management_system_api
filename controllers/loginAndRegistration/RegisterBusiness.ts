import Express from 'express'
import MySQL from 'mysql'
import CoreBusinessTable from '../../models/core/BusinessTable'
import { generateSessionToken, generateStringID, fullDateTime } from '../../modules/GeneralModules'
import path from 'path'
import dotenv from 'dotenv'
import BusinessOwnerTable from '../../models/core/BusinessOwnerTable'
import BusinessDatabaseTable from '../../models/core/BusinessDatabaseTable'
import DatabaseMigration from '../../models/general/DatabaseMigration'
import ContactTable from '../../models/mainApp/default/ContactTable'
import AddressTable from '../../models/mainApp/default/AddressTable'
import PersonTable from '../../models/mainApp/default/PersonTable'
import EmployeeTable from '../../models/mainApp/default/EmployeeTable'
import UserTable from '../../models/mainApp/default/UserTable'
import SetupTable from '../../models/mainApp/default/SetupTable'
import SessionTable from '../../models/mainApp/default/SessionTable'
import DefaultBusinessTable from '../../models/mainApp/default/BusinessTable'
import { AppDefaultModelList } from '../../models/list/AppDefaultModelList'
import { iControllerResponse } from '../../modules/interfaces/IGeneralInterface'
dotenv.config({ path: path.join(__dirname, `../../.env`)})
import md5 from 'md5'
import FileWriter from '../../modules/FileWriter'
import DefaultPrivilegeTable from '../../models/mainApp/default/DefaultPrivilegeTable'

interface requestBody {
    businessName?:string
    taxIdentification?:string
    nationalID?:string
    phone?:string
    dob?:string,
    mobile?:string
    email?:string
    alternativeEmail?:string
    smsDisplayName?:string
    logo?:string
    address?:string
    country?:string
    stateOrRegion?:string
    digitalAddress?:string
    cityOrTown?:string
    currency?:string
    firstName?:string
    otherName?:string
    theme?:string
    lastName?:string
    gender?:string
    username?:string
    password?:string
    confirmPassword?:string
    placeOfBirth?:string
    maritalStatus?:string
    nationality?:string
    socialSecurityNumber?:string
    latitude?:string
    longitude?:string
    suburb?:string
    landmark?:string
    macAddress?:string
}

const RegisterBusinessController = async (database:MySQL.Connection|null, request:Express.Request, response:Express.Response) => {
    let data:requestBody = request.body

    //check for required fields
    if (!data.businessName || !data.nationalID || !data.phone || !data.email || !data.address || 
        !data.country || !data.stateOrRegion || !data.cityOrTown || !data.firstName || 
        !data.lastName || !data.gender || !data.username || !data.password || !data.currency || !data.theme){
        response.status(200).json({status: "empty", message: "Some fields are required!"})
        return
    }

    //check for password match
    if (data.password !== data.confirmPassword){
        response.status(200).json({status: "error", message: "Passwords do not match!"})
        return
    }

    if (!data.macAddress) {
        response.status(200).json({status: "error", message: "Missing important parameter. Contact system administrator for support!"})
        return
    }

    //Initialize response message
    const returnMessage:iControllerResponse = {status: '', message: ''}

    //Generate business unique code
    let businessCode = generateStringID(data.businessName)

    //Generate schema name for business
    let schemaName = `ovasyte_${businessCode}_db`

    //insert into core database (business, businessOwner, businessDatabase)
    const coreBusinessTable =  new CoreBusinessTable(undefined, database, process.env.CORE_DB_NAME)
    const OwnerTable = new BusinessOwnerTable(undefined, database, process.env.CORE_DB_NAME)
    const businessDatabaseTable = new BusinessDatabaseTable(undefined, database, process.env.CORE_DB_NAME)
    const contactTable = new ContactTable(undefined, database, schemaName)
    const addressTable = new AddressTable(undefined, database, schemaName)
    const defaultBusinessTable = new DefaultBusinessTable(undefined, database, schemaName)
    const personTable = new PersonTable(undefined, database, schemaName)
    const employeeTable = new EmployeeTable(undefined, database, schemaName)
    const userTable = new UserTable(undefined, database, schemaName)
    const setupTable = new SetupTable(undefined, database, schemaName)
    const sessionTable = new SessionTable(undefined, database, schemaName)
    const privilegeTable = new DefaultPrivilegeTable(undefined, database, schemaName)

    //run migration using the generated schema name (will automatically create the default tables)
    //Run migration to create tables
    const modelList = AppDefaultModelList
    const defaultDatabaseMigration = new DatabaseMigration(database, schemaName, modelList)
    const migrationResult = await defaultDatabaseMigration.createDatabase()

    //Insert into related tables
    if (migrationResult) {
        //Insert into core business table
        coreBusinessTable.setValues({
            uniqueCode: businessCode,
            name: data.businessName,
            location: data.digitalAddress,
            address: data.address,
            email: data.email,
            phone: data.phone,
            country: data.country,
            stateOrRegion: data.stateOrRegion,
            cityOrTown: data.cityOrTown
        })
        const coreBusinessSaveResult = await coreBusinessTable.save()

        //Check if core business data is successfully inserted
        if (coreBusinessSaveResult.type === 'success') {
            //Insert into businessOwnerTable
            OwnerTable.setValues({
                businessID: coreBusinessSaveResult.primaryKey,
                firstName: data.firstName,
                otherName: data.otherName,
                lastName: data.lastName,
            })
            const businessOwnerSaveResult = await OwnerTable.save()

            if (businessOwnerSaveResult.type === 'success') {
                //Insert into businessDatabaseTable
                businessDatabaseTable.setValues({
                    businessID: coreBusinessSaveResult.primaryKey,
                    schemaName: schemaName
                })
                await businessDatabaseTable.save()
            }

            //insert into contactTable
            contactTable.setValues({
                phone: data.phone,
                mobile: data.mobile,
                email: data.email,
                alternativeEmail: data.alternativeEmail,
                website: '',
                socialLinks: ''
            })
            const contactSaveResult = await contactTable.save()

            //insert into addressTable
            addressTable.setValues({
                postalAddress: data.address,
                digitalAddress: data.digitalAddress,
                location: data.address,
                landMark: data.landmark,
                geoLatitude: data.latitude,
                geoLongitude: data.longitude,
                country: data.country,
                stateOrRegion: data.stateOrRegion,
                cityOrTown: data.cityOrTown,
                suburb: data.suburb
            })
            const addressSaveResult = await addressTable.save()

            //insert into the businessTable
            defaultBusinessTable.setValues({
                uniqueCode: businessCode,
                name: data.businessName,
                taxIdentificationNumber: data.taxIdentification,
                smsDisplayName: data.smsDisplayName,
                contactID: contactSaveResult.type === 'success' ? contactSaveResult.primaryKey : 0,
                addressID: addressSaveResult.type === 'success' ? addressSaveResult.primaryKey : 0
            })
            const defaultBusinessSaveResult = await defaultBusinessTable.save()

            //insert into personTable
            personTable.setValues({
                firstName: data.firstName,
                otherName: data.otherName,
                lastName: data.lastName,
                gender: data.gender,
                dateOfBirth: data.dob,
                maritalStatus: data.maritalStatus,
                placeOfBirth: data.placeOfBirth,
                nationality: data.nationality,
                nationalIdNumber: data.nationalID,
                socialSecurityNumber: data.socialSecurityNumber
            })
            const personSaveResult = await personTable.save()

            //insert into employeeTable
            employeeTable.setValues({
                personID: personSaveResult.type === 'success' ? personSaveResult.primaryKey : 0,
                contactID: contactSaveResult.type === 'success' ? contactSaveResult.primaryKey : 0,
                addressID: addressSaveResult.type === 'success' ? addressSaveResult.primaryKey : 0,
                departmentID: null,
                role: undefined,
                employeeBankID: null,
                sessionID: null
            })
            const employeeSaveResult = await employeeTable.save()

            //insert into userTable
            userTable.setValues({
                employeeID: employeeSaveResult.type === 'success' ? employeeSaveResult.primaryKey : 0,
                username: data.username,
                password: md5(data.password),
                sessionID: undefined
            })
            const userSaveResult = await userTable.save()

            let logoFileName
            if (data.logo) {
                const fileUploader = new FileWriter(data.logo, businessCode)
                let uploadResult = await fileUploader.__init__()
                logoFileName = uploadResult[0].file
            }

            //insert into setupTable
            setupTable.setValues({
                businessID: defaultBusinessSaveResult.type === 'success' ? defaultBusinessSaveResult.primaryKey : 0,
                logo: logoFileName ? logoFileName : (data.logo ? data.logo.split('.txt').join("") : undefined),
                theme: data.theme,
                currency: data.currency
            })
            const setupSaveResult = await setupTable.save()

            privilegeTable.setValues({
                userID: userSaveResult.type === 'success' ? userSaveResult.primaryKey : 0,
                assignAllPrivileges: 'yes',
                updateBusinessProfile: 'yes',
                addNewEmployee: 'yes',
                updateExistingEmployee: 'yes',
                deactivateExistingEmployee: 'yes',
                deleteExistingEmployee: 'yes',
                addNewUser: 'yes',
                updateExistingUser: 'yes',
                deactivateExistingUser: 'yes',
                deleteExistingUser: 'yes'
            })
            const privilegeSaveResult = await privilegeTable.save()

            //generate session token using schemaName, macAddress, IPAddress, os, deviceType, browser
            const sessionToken = generateSessionToken(request, data.macAddress ? data.macAddress : '', schemaName)

            //insert into session
            sessionTable.setValues({
                userID: userSaveResult.type === 'success' ? userSaveResult.primaryKey : 0,
                loginDateAndTime: fullDateTime(),
                logoutDateAndTime: null,
                token: sessionToken
            })
            const sessionSaveResult = await sessionTable.save()

            //return these data to client: (schemaName, sessionID)
            returnMessage.status = 'success'
            returnMessage.message = 'Congratulations! You have successfully created your business account!'
            returnMessage.data = {schemaName, token: sessionSaveResult.type === 'success' ? sessionSaveResult.primaryKey : null, businessID: businessCode, businessName: data.businessName, userID: userSaveResult.primaryKey}
            
        } else if (coreBusinessSaveResult.type === 'exist') {
            returnMessage.status = 'warning'
            returnMessage.message = 'Business with same name exist!'
        } else {
            returnMessage.status = 'error'
            returnMessage.message = 'Something went wrong, please try again later!'
        }
    } else {
        returnMessage.status = 'error'
        returnMessage.message = 'Internal server error, please try again later!'
    }

    response.status(200).json(returnMessage)
}

export default RegisterBusinessController

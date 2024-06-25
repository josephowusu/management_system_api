import DatabaseMigration from "./general/DatabaseMigration"
import path from 'path'
import dotenv from 'dotenv'
import AllSystemModelLists from "./list/AllModelLists"
import SoftwarePurchaseTable from "./core/SoftwarePurchaseTable"
import DatabaseConnection from "./general/DatabaseConnection"
import BusinessDatabaseTable from "./core/BusinessDatabaseTable"
import { fullDate } from "../modules/GeneralModules"
import { iModelList, iSystemModelListValues } from "../modules/interfaces/iMigration"
dotenv.config({ path: path.join(__dirname, `../.env`)})


const runAllMigrations = async () => {
    const database = DatabaseConnection.__init__()

    const CoreDatabaseMigration = new DatabaseMigration(database, process.env.CORE_DB_NAME ? process.env.CORE_DB_NAME : '', AllSystemModelLists.OvasyteCore)
    let createResult = await CoreDatabaseMigration.createDatabase()
    console.log(`Creation of Core tables result: `, createResult, '\n\n')

    const businessDatabasesModel = new BusinessDatabaseTable(undefined, database, process.env.CORE_DB_NAME)
    const softwarePurchase = new SoftwarePurchaseTable(undefined, database, process.env.CORE_DB_NAME)

    let businessDatabases = await businessDatabasesModel.getAll(0, 0)
    for (let i = 0; i < businessDatabases.length; i++) {
        const dbDetails = businessDatabases[i]

        const modelLists:iModelList[] = []

        console.log('===> Business Code: ', dbDetails.uniqueCode)

        let result = await getPurchasedFeatures(dbDetails, softwarePurchase)
        // console.log('result: ', result)
 
        if (Array.isArray(result.featuresResult) && result.featuresResult.length) {
            for (let f = 0; f < result.featuresResult.length; f++) {
                let appName:iSystemModelListValues = result.featuresResult[f]
                // console.log('appName: ', appName)
                if (AllSystemModelLists[appName]) {
                    for (let p = 0; p < AllSystemModelLists[appName].length; p++) {
                        const model = AllSystemModelLists[appName][p]
                        // console.log('model.tableName: ', model.tableName)
                        modelLists.push(model)
                    }
                }
            }
        }

        const CoreDatabaseMigration = new DatabaseMigration(database, dbDetails.schemaName, modelLists, result.tablesResult)
        let createResult = await CoreDatabaseMigration.createDatabase(dbDetails.schemaName)
        console.log(`Creation of ${dbDetails.schemaName} tables result: `, createResult, '\n\n')
    }
}

const getPurchasedFeatures = async (dbDetails:any, softwarePurchase:SoftwarePurchaseTable) => {
    let featuresResult:any[] = []
    let tablesResult:any[] = []

    let purchaseResult = await softwarePurchase.get(`businessID = ? AND businessCode = ? AND endOfSubscriptionDate >= ?`, 
    [dbDetails.businessID, dbDetails.uniqueCode, fullDate()], 0, 0)

    for (let j = 0; j < purchaseResult.length; j++) {
        const item = purchaseResult[j]
        let features:string[] = item.features ? JSON.parse(item.features) : []
        let tables:string[] = item.featureTables ? JSON.parse(item.featureTables) : []

        featuresResult = [...featuresResult, ...features]
        tablesResult = [...tablesResult, ...tables]
    }

    return {featuresResult, tablesResult}
}

runAllMigrations()


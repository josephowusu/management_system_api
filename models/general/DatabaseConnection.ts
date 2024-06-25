import MySQL from 'mysql'
import path from 'path'
import dotenv from 'dotenv'
import Logger from '../../modules/Logger'
dotenv.config({ path: path.join(__dirname, `../../.env`)})

class DatabaseConnection {
    private static databaseObject:MySQL.Connection|null = null
    private static dbHost = process.env.DB_SERVER_HOST
    private static dbPort:number = process.env.DB_SERVER_PORT ? Number(process.env.DB_SERVER_PORT) : 4000
    private static dbUser = process.env.DB_USERNAME
    private static dbPassword = process.env.DB_PASSWORD
    
    public static __init__() {
        try {
            this.databaseObject = MySQL.createConnection({
                host: this.dbHost,
                port: this.dbPort,
                user: this.dbUser,
                password: this.dbPassword
            })
    
            if (this.databaseObject) {
                this.databaseObject.connect((error) => {
                    if (error) {
                        Logger.log('error', `DatabaseConnection.ts`, `Database server connection error:: ${error.message}`)
                    } else {
                        console.log('Database server is connected!')
                        Logger.log('info', `DatabaseConnection.ts`, 'Database server is connected!')
                    }
                })
    
                return this.databaseObject
            }
    
            return null
        } catch (error:any) {
            Logger.log('error', `DatabaseConnection.ts`, `Database server connection error: ${error.message}`)
            return null
        }
    }
}

export default DatabaseConnection
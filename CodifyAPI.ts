import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, `.env`)})
import Express from 'express'
import cors from 'cors'
import { Server, Socket } from 'socket.io'
import { createServer } from 'http'
import DatabaseConnection from './models/general/DatabaseConnection'
import MySQL from 'mysql'
import LoginAndRegistrationRouter from './routers/LoginAndRegistration'
import Logger from './modules/Logger'
import MainAppRouter from './routers/MainApp'

 
class SystemAPI {
    private systemApp:Express.Application
    private database:MySQL.Connection|null
    private appPortNumber:number
    private serverURL:string

    constructor() {
        this.systemApp = Express()
        this.database = DatabaseConnection.__init__()
        this.appPortNumber = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 4000
        this.serverURL = process.env.SERVER_URL ? process.env.SERVER_URL : 'http://localhost'
        this.__init__()
    }

    private __init__() {
        this._useModules()
        LoginAndRegistrationRouter(this.systemApp, this.database)
        this._startServer()
    }

    private _startServer() {
        const httpServer = createServer(this.systemApp)

        const socketConnection = new Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST', 'DELETE', 'PUT']
            }
        })

        httpServer.listen(this.appPortNumber, () => {
            console.log(`Server is running on ${this.serverURL.includes('localhost') ? this.serverURL+':'+this.appPortNumber : this.serverURL}`)
            Logger.log('info', `SystemAPI.ts`, `Server is running on ${this.serverURL.includes('localhost') ? this.serverURL+':'+this.appPortNumber : this.serverURL}`)
        })

        socketConnection.on('connection', (io:Socket) => {
            // console.log('io socket: ', io.handshake.headers['user-agent'])
            MainAppRouter(io, this.database)
        })
    }

    private _useModules() {
        this.systemApp.use(Express.urlencoded({extended: false}))
        this.systemApp.use(Express.json())
        this.systemApp.use(cors({
            origin: "*",
            methods: ['GET', 'POST', 'DELETE', 'PUT']
        }))
        this.systemApp.use('/uploads', Express.static('uploads'));
    }
}

new SystemAPI()
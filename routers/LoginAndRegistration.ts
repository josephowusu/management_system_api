import Express from 'express'
import MySQL from 'mysql'
import LoginController from '../controllers/loginAndRegistration/LoginController'
import RegisterBusinessController from '../controllers/loginAndRegistration/RegisterBusiness'
import UserAgent from 'express-useragent'
import FileUploaderController from '../controllers/mainApp/default/FileUploaderController'
import { iFileUploaderData } from '../modules/interfaces/IGeneralInterface'

const LoginAndRegistrationRouter = (server:Express.Application, database:MySQL.Connection|null) => {

    server.get('/', (request:Express.Request, response:Express.Response) => {
        response.status(200).json({
            type: 'success',
            message: 'Ok'
        })
    })

    server.post('/login', (request:Express.Request, response:Express.Response) => {
        LoginController(database, request, response)
    })

    server.post('/register-business', (request:Express.Request, response:Express.Response) => {
        RegisterBusinessController(database, request, response)
    })

    server.post('/upload-file', (request:Express.Request, response:Express.Response) => {
        const data:iFileUploaderData = request.body
        FileUploaderController(data, 'http', undefined, response)
    })

}


export default LoginAndRegistrationRouter
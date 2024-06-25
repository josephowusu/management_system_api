import Express from 'express'
import MySQL from 'mysql'


const fileUploadRouter = (server:Express.Application, database:MySQL.Connection|null) => {

    server.get('/', (request:Express.Request, response:Express.Response) => {
        response.status(200).json({
            type: 'success',
            message: 'Ok'
        })
    })

    server.post('/uploadFile', (request:Express.Request, response:Express.Response) => {
        
    })

}


export default fileUploadRouter
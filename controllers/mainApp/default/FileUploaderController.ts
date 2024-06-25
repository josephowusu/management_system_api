import { createWriteStream, existsSync, mkdirSync } from "fs"
import { iFileUploaderData, iSocketCallback } from "../../../modules/interfaces/IGeneralInterface"
import Express from 'express'


const FileUploaderController = async (data:iFileUploaderData, requestType:'socket'|'http', callback?:iSocketCallback, response?:Express.Response) => {
    try {
        if (!existsSync(__dirname+'/../../../uploads')) {
            mkdirSync(__dirname+'/../../../uploads')
        } 

        if (!existsSync(__dirname+'/../../../uploads/temp/')) {
            mkdirSync(__dirname+'/../../../uploads/temp/')
        } 

        let fileName = ''

        if (data.fileName) {
            fileName = data.fileName
        } else {
            fileName = 'new_file_upload_'+Date.now().toString()+'.'+data.fileType
        }

        let newByte = (data.startByte + data.endByte)
        if (newByte <= data.fileSize) {
            const tempWriteStream = createWriteStream(__dirname+'/../../../uploads/temp/'+fileName+'.txt', { flags: 'a' })
            tempWriteStream.write(data.chunk.split("base64,")[1])
            tempWriteStream.end()
        }

        let responseData:any = {} 

        if (newByte < data.fileSize) {
            responseData = {
                status: 'more',
                startByte: newByte,
                endByte: data.endByte,
                fileName: fileName,
                fileSize: data.fileSize,
                fileType: data.fileType
            }
        } else if (newByte > data.fileSize) {
            let remainingByte = (data.fileSize - data.startByte)
            responseData = {
                status: 'more',
                startByte: data.startByte,
                endByte: remainingByte,
                fileName: fileName,
                fileSize: data.fileSize,
                fileType: data.fileType
            }
        } else {
            console.log('Finished: ', data.fileName, ' => startByte:', data.startByte, ' endByte:', data.endByte, ' size:', data.fileSize)
            responseData = {
                status: 'finish',
                startByte: data.startByte,
                endByte: data.endByte,
                fileName: fileName,
                fileSize: data.fileSize,
                fileType: data.fileType
            }
        }


        if (requestType === 'socket' && callback) {
            callback(responseData)
        }

        if (requestType === 'http' && response) {
            response.status(200).json(responseData)
        }

    } catch (error:any) {
        if (requestType === 'socket' && callback) {
            callback({status: 'error', message: error.message})
        }

        if (requestType === 'http' && response) {
            response.status(401).json({status: 'error', message: error.message})
        }
    }
}

export default FileUploaderController
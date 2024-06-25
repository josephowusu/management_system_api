import { createReadStream, existsSync, mkdirSync, unlink, writeFile } from "fs"


class FileWriter {
    private fileNames:string[]
    private businessCode:string
    private filePath:string
    private subFolder:string

    constructor(fileNames:string[]|string, businessCode:string, subFolder?:string) {
        this.businessCode = businessCode
        this.fileNames = Array.isArray(fileNames) ? fileNames : [fileNames]
        this.subFolder = subFolder ? subFolder : ''
        this.filePath = __dirname+'/../uploads/'+this.businessCode+subFolder+'/'
    }

    public async __init__() {
        let result = []
        this._createDirectory()
        if (this.fileNames.length) {
            for (let i = 0; i < this.fileNames.length; i++) {
                let rwResult = await this._readDataToWrite(this.fileNames[i])
                result.push({
                    file: this.fileNames[i],
                    message: rwResult ? rwResult : 'error'
                })
            }
        }

        return result
    }

    private _createDirectory() {
        if (!existsSync(__dirname+'/../uploads')) {
            mkdirSync(__dirname+'/../uploads')
        } 

        if (!existsSync(__dirname+'/../uploads/'+this.businessCode)) {
            mkdirSync(__dirname+'/../uploads/'+this.businessCode)
        } 

        if (this.subFolder) {
            if (!existsSync(__dirname+'/../uploads/'+this.businessCode+this.subFolder)) {
                mkdirSync(__dirname+'/../uploads/'+this.businessCode+this.subFolder)
            }
        }

        return
    }

    private async _readDataToWrite(fileName:string):Promise<string|null> {
        return new Promise((resolve, reject) => {
            if (existsSync(__dirname+'/../uploads/temp/'+fileName+'.txt')) {
                const thisClass = this
    
                const readTxtFileData = createReadStream(__dirname+'/../uploads/temp/'+fileName+'.txt')
        
                let txtData = ''
        
                readTxtFileData.on('data', (chunk) => {
                    txtData += chunk
                })
        
                readTxtFileData.on('error', (err) => {
                    console.log('Error reading file: ', err)
                })
        
                readTxtFileData.on('end', async () => {
                    let result = await thisClass._createFile(txtData, fileName)
                    resolve(result)
                })
            } else {
                console.log('file with path does not exist: ', this.filePath+fileName+'.txt')
                resolve(null)
            }
        })
    }

    private async _createFile(fileData:string, fileName:string):Promise<string|null> {
        return new Promise((resolve, reject) => {
            try {
                writeFile(this.filePath+fileName, fileData, 'base64', () => {
                    console.log(fileName, ' is written.')
                    unlink(__dirname+'/../uploads/temp/'+fileName+'.txt', () => {
                        console.log(fileName+'.txt', ' is removed from temp.')
                        resolve(fileName)
                    })
                })
            } catch (error) {
                console.log('Error while writing file: ', error)
                resolve(null)
            }
        })
    }
}

export default FileWriter

import { join } from "path"
import { existsSync, mkdirSync, appendFileSync } from "fs"

class Logger {
    private static folderDir = './logs'
    private static infoDir = this.folderDir+'/info.log'
    private static errorDir = this.folderDir+'/error.log'
    private static warningDir = this.folderDir+'/warning.log'

    private static __init__() {
        try {
            if (!existsSync(this.folderDir)) {
                mkdirSync(this.folderDir)
            }
        } catch (error) {
            console.log('Logger error:: ', error)
        }

        return true
    }

    public static log(type:'info'|'error'|'warning', filename?:string, message?:string) {
        try {
            if (this.__init__()) {
                const today = new Date()
                message = `${today.toUTCString()} ==> ${filename ? '(' + filename + '): ' : ''} ${message ? message : ''} \n\n`
                if (type === 'error') {
                    appendFileSync(this.errorDir, message, 'utf8')
                } else if (type === 'info') {
                    appendFileSync(this.infoDir, message, 'utf8')
                } else if (type === 'warning') {
                    appendFileSync(this.warningDir, message, 'utf8')
                }
            }
        } catch (error) {
            console.log('Logger error: ', error)
        }
    }
}

export default Logger
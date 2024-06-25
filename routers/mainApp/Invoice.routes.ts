import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import InvoiceController from "../../controllers/mainApp/miniAccount/InvoiceController"

const InvoiceRoutes = (socket:Socket, database:MySQL.Connection|null) => {

    // socket.on("/invoice/insertUpdate", (body, callback:iSocketCallback) => {
    //     InvoiceController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/invoice/fetch", (body, callback:iSocketCallback) => {
    //     InvoiceController("fetch", socket, database, body, callback)
    // })

}

export default InvoiceRoutes
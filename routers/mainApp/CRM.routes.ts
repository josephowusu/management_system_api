import MySQL from "mysql"
import { Socket } from "socket.io"
import ProductCategoryController from "../../controllers/mainApp/inventory/ProductCategoryController"
import ClientController from "../../controllers/mainApp/crm/ClientController"
import { iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import ClientCategoryController from "../../controllers/mainApp/crm/ClientCategoryController"
import BulkSMSController from "../../controllers/mainApp/crm/BulkSMScontroller"

const CRMRoutes = (socket:Socket, database:MySQL.Connection|null) => {

    socket.on("/crm/insertUpdate", (body, callback:iSocketCallback) => {
        ClientController("insert/update", socket, database, body, callback)
    })

    socket.on("/crm/fetch", (body, callback:iSocketCallback) => {
        ClientController("fetch", socket, database, body, callback)
    })

    socket.on("/crmCategory/insertUpdate", (body, callback:iSocketCallback) => {
        ClientCategoryController("insert/update", socket, database, body, callback)
    })

    socket.on("/crmCategory/fetch", (body, callback:iSocketCallback) => {
        ClientCategoryController("fetch", socket, database, body, callback)
    })

    socket.on("/crm/SendBulkSMS/", (body, callback:iSocketCallback) => {
        BulkSMSController("sendBulkSMS", socket, database, body, callback)
    })

}

export default CRMRoutes
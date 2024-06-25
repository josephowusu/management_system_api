import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import SalesController from "../../controllers/mainApp/pos/SaleController"


const POSRoutes = (socket:Socket, database:MySQL.Connection|null) => {

    // socket.on("/POS/sales/insertUpdate", (body, callback:iSocketCallback) => {
    //     SalesController("insert/update", socket, database, body, callback)
    // })

}

export default POSRoutes
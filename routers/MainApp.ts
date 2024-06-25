import MySQL from "mysql"
import { Socket } from "socket.io"
import CRMRoutes from "./mainApp/CRM.routes"
import InventoryRoutes from "./mainApp/Inventory.routes"
import MiniAccountRoutes from "./mainApp/MiniAccount.routes"
import InvoiceRoutes from "./mainApp/Invoice.routes"
import DefaultRoutes from "./mainApp/default.routes"
import HRRoutes from "./mainApp/HR.routes"
import POSRoutes from "./mainApp/POS.routes"

const MainAppRouter = (socket:Socket, database:MySQL.Connection|null) => {

    DefaultRoutes(socket, database)

    CRMRoutes(socket, database)

    InventoryRoutes(socket, database)

    MiniAccountRoutes(socket, database)

    InvoiceRoutes(socket, database)

    HRRoutes(socket, database)

    POSRoutes(socket, database)

}


export default MainAppRouter

import MySQL from "mysql"
import { Socket } from "socket.io"
import { iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import TierController from "../../controllers/mainApp/hr/TierController"
import RoleController from "../../controllers/mainApp/hr/RoleController"
import AssignRoleController from "../../controllers/mainApp/hr/AssignRoleController"


const HRRoutes = (socket:Socket, database:MySQL.Connection|null) => {

    // socket.on("/hr/insertUpdate", (body, callback:iSocketCallback) => {
    //     TierController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/hr/fetch", (body, callback:iSocketCallback) => {
    //     TierController("fetch", socket, database, body, callback)
    // })

    // socket.on("/hr/insertUpdate", (body, callback:iSocketCallback) => {
    //     RoleController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/hr/fetch", (body, callback:iSocketCallback) => {
    //     RoleController("fetch", socket, database, body, callback)
    // })

    // socket.on("/hr/insertUpdate", (body, callback:iSocketCallback) => {
    //     AssignRoleController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/hr/fetch", (body, callback:iSocketCallback) => {
    //     AssignRoleController("fetch", socket, database, body, callback)
    // })
}

export default HRRoutes
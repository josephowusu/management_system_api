import MySQL from "mysql"
import { Socket } from "socket.io"
import CollectionCategoryController from "../../controllers/mainApp/miniAccount/CollectionCategoryController"
import ExpenseCategoryController from "../../controllers/mainApp/miniAccount/ExpenseCategoryController"
import ExpenseController from "../../controllers/mainApp/miniAccount/ExpenseController"
import { iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import CollectionController from "../../controllers/mainApp/miniAccount/CollectionController"
import CompanyBankController from "../../controllers/mainApp/miniAccount/CompanyBankController"
import DebtCategoryController from "../../controllers/mainApp/miniAccount/DebtCategoryController"
import DebtController from "../../controllers/mainApp/miniAccount/DebtController"

const MiniAccountRoutes = (socket:Socket, database:MySQL.Connection|null) => {

    // socket.on("/miniAccount/expenseCategory/insertUpdate", (body, callback:iSocketCallback) => {
    //     ExpenseCategoryController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/miniAccount/expenseCategory/fetch", (body, callback:iSocketCallback) => {
    //     ExpenseCategoryController("fetch", socket, database, body, callback)
    // })

    // socket.on("/miniAccount/expense/insertUpdate", (body, callback:iSocketCallback) => {
    //     ExpenseController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/miniAccount/expense/fetch", (body, callback:iSocketCallback) => {
    //     ExpenseController("fetch", socket, database, body, callback)
    // })

    // socket.on("/miniAccount/collectionCategory/insertUpdate", (body, callback:iSocketCallback) => {
    //     CollectionCategoryController("insert/update", socket, database, body, callback)
    // })
    
    // socket.on("/miniAccount/collectionCategory/fetch", (body, callback:iSocketCallback) => {
    //     CollectionCategoryController("fetch", socket, database, body, callback)
    // })
    
    // socket.on("/miniAccount/collection/insertUpdate", (body, callback:iSocketCallback) => {
    //     CollectionController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/miniAccount/collection/fetch", (body, callback:iSocketCallback) => {
    //     CollectionController("fetch", socket, database, body, callback)
    // })

    // socket.on("/companyBank/insertUpdate", (body, callback:iSocketCallback) => {
    //     CompanyBankController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/companyBank/fetch", (body, callback:iSocketCallback) => {
    //     CompanyBankController("fetch", socket, database, body, callback)
    // })

    // socket.on("/debt/insertUpdate", (body, callback:iSocketCallback) => {
    //     DebtController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/debt/fetch", (body, callback:iSocketCallback) => {
    //     DebtController("fetch", socket, database, body, callback)
    // })

    // socket.on("/debtCategory/insertUpdate", (body, callback:iSocketCallback) => {
    //     DebtCategoryController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/debtCategory/fetch", (body, callback:iSocketCallback) => {
    //     DebtCategoryController("fetch", socket, database, body, callback)
    // })

}


export default MiniAccountRoutes
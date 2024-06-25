import MySQL from "mysql"
import { Socket } from "socket.io"
import ProductCategoryController from "../../controllers/mainApp/inventory/ProductCategoryController"
import ProductController from "../../controllers/mainApp/inventory/ProductController"
import StockController from "../../controllers/mainApp/inventory/StockController"
import SupplierController from "../../controllers/mainApp/inventory/SupplierController"
import { iSocketCallback } from "../../modules/interfaces/IGeneralInterface"
import ProductInStockController from "../../controllers/mainApp/inventory/ProductInStockController"
import ProductUOMController from "../../controllers/mainApp/inventory/productUOMController"

const InventoryRoutes = (socket:Socket, database:MySQL.Connection|null) => {

    // socket.on("/inventory/productCategory/insertUpdate", (body, callback:iSocketCallback) => {
    //     ProductCategoryController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/inventory/productCategory/fetch", (body, callback:iSocketCallback) => {
    //     ProductCategoryController("fetch", socket, database, body, callback)
    // })

    // socket.on("/inventory/product/insertUpdate", (body, callback:iSocketCallback) => {
    //     ProductController("insert/update", socket, database, body, callback)
    // })
    
    // socket.on("/inventory/product/fetch", (body, callback:iSocketCallback) => {
    //     ProductController("fetch", socket, database, body, callback)
    // })

    // socket.on("/inventory/productUOMAndPrice/update", (body, callback:iSocketCallback) => {
    //     ProductUOMController("update", socket, database, body, callback)
    // })

    // socket.on("/inventory/productUOMAndPrice/fetch", (body, callback:iSocketCallback) => {
    //     ProductUOMController("fetch", socket, database, body, callback)
    // })

    // socket.on("/inventory/supplier/insertUpdate", (body, callback:iSocketCallback) => {
    //     SupplierController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/inventory/supplier/fetch", (body, callback:iSocketCallback) => {
    //     SupplierController("fetch", socket, database, body, callback)
    // })

    // socket.on("/inventory/stock/insertUpdate", (body, callback:iSocketCallback) => {
    //     StockController("insert/update", socket, database, body, callback)
    // })

    // socket.on("/inventory/stock/fetch", (body, callback:iSocketCallback) => {
    //     StockController("fetch", socket, database, body, callback)
    // })

    // socket.on("/inventory/productInStock/fetch", (body, callback:iSocketCallback) => {
    //     ProductInStockController("fetch", socket, database, body, callback)
    // })
    
}

export default InventoryRoutes
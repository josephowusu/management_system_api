import { iModelList } from '../../modules/interfaces/iMigration'
import ProductCategoryTable from '../mainApp/inventory/ProductCategoryTable'
import ProductTable from '../mainApp/inventory/ProductTable'
import SupplierTable from '../mainApp/inventory/SupplierTable'
import StockTable from '../mainApp/inventory/StockTable'
import InventoryPrivilegeTable from '../mainApp/inventory/InventoryPrivilegeTable'
import ClientTable from '../mainApp/crm/ClientTable'
import ClientCategoryTable from '../mainApp/crm/ClientCategoryTable'
import CRMPrivilegeTable from '../mainApp/crm/CRMPrivilegeTable'
import InvoiceTable from '../mainApp/miniAccount/InvoiceTable'
import ExpenseCategoryTable from '../mainApp/miniAccount/ExpenseCategoryTable'
import ExpenseTable from '../mainApp/miniAccount/ExpenseTable'
import CollectionCategoryTable from '../mainApp/miniAccount/CollectionCategoryTable'
import ProductInStockTable from '../mainApp/inventory/ProductInStockTable'
import CollectionTable from '../mainApp/miniAccount/CollectionTable'
import CompanyBankTable from '../mainApp/miniAccount/CompanyBankTable'
import MiniAccountPrivilegeTable from '../mainApp/miniAccount/MiniAccountPrivilegeTable'
import DebtTable from '../mainApp/miniAccount/DebtTable'
import DebtCategoryTable from '../mainApp/miniAccount/DebtCategoryTable'
import BulkSMSTable from '../mainApp/crm/BulkSMSTable'
import TierTable from '../mainApp/hr/TierTable'
import HRPrivilegeTable from '../mainApp/hr/HRPrivilegeTable'
import RoleTable from '../mainApp/hr/RoleTable'
import AssignRoleTable from '../mainApp/hr/AssignRoleTable'
import POSPrivilegeTable from '../mainApp/pos/POSprivilegeTable'
import SalesTable from '../mainApp/pos/SalesTable'

export const InventoryModelList:iModelList[] = [
    {
        tableName: 'ProductCategoryTable',
        tableDescription: new ProductCategoryTable().tableDescription()
    },
    {
        tableName: 'ProductTable',
        tableDescription: new ProductTable().tableDescription()
    },
    {
        tableName: 'SupplierTable',
        tableDescription: new SupplierTable().tableDescription()
    },
    {
        tableName: 'StockTable',
        tableDescription: new StockTable().tableDescription()
    },
    {
        tableName: 'InventoryPrivilegeTable',
        tableDescription: new InventoryPrivilegeTable().tableDescription()
    },
    {
        tableName: 'ProductInStockTable',
        tableDescription: new ProductInStockTable().tableDescription()
    }
]

export const CustomerRelationshipManagementModelList:iModelList[] = [
    {
        tableName: 'ClientTable',
        tableDescription: new ClientTable().tableDescription()
    },
    {
        tableName: 'ClientCategoryTable',
        tableDescription: new ClientCategoryTable().tableDescription()
    },
    {
        tableName: 'BulkSMSTable',
        tableDescription: new BulkSMSTable().tableDescription()
    },
    {
        tableName: 'CRMPrivilegeTable',
        tableDescription: new CRMPrivilegeTable().tableDescription()
    },
    
]


export const MiniAccountModelList:iModelList[] = [
    {
        tableName: 'CompanyBankAccount',
        tableDescription: new CompanyBankTable().tableDescription()
    },
    {
        tableName: 'ExpenseCategoryTable',
        tableDescription: new ExpenseCategoryTable().tableDescription()
    },
    {
        tableName: 'ExpenseTable',
        tableDescription: new ExpenseTable().tableDescription()
    },
    {
        tableName: 'MiniAccountPrivilegeTable',
        tableDescription: new MiniAccountPrivilegeTable().tableDescription()
    },
    {
        tableName: 'CollectionCategoryTable',
        tableDescription: new CollectionCategoryTable().tableDescription()
    },
    {
        tableName: 'CollectionTable',
        tableDescription: new CollectionTable().tableDescription()
    },
    {
        tableName: 'InvoiceTable',
        tableDescription: new InvoiceTable().tableDescription()
    },
    {
        tableName: 'DeptCategoryTable',
        tableDescription: new DebtCategoryTable().tableDescription()
    },
    {
        tableName: 'DeptTable',
        tableDescription: new DebtTable().tableDescription()
    }
]

export const HumanResourceManagementModelList:iModelList[] = [
    {
        tableName: 'TierTable',
        tableDescription: new TierTable().tableDescription()
    },
    {
        tableName: 'HRPrivilegeTable',
        tableDescription: new HRPrivilegeTable().tableDescription()
    },
    {
        tableName: 'RoleTable',
        tableDescription: new RoleTable().tableDescription()
    },
    {
        tableName: 'AssignRoleTable',
        tableDescription: new AssignRoleTable().tableDescription()
    },
]


export const PointOfSaleModelList:iModelList[] = [
    {
        tableName: 'POSPrivilegeTable',
        tableDescription: new POSPrivilegeTable().tableDescription()
    },
    {
        tableName: 'SalesTable',
        tableDescription: new SalesTable().tableDescription()
    }
]
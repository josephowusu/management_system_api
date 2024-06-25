import { iModelList } from '../../modules/interfaces/iMigration'
import AddressTable from '../mainApp/default/AddressTable'
import BusinessTable from '../mainApp/default/BusinessTable'
import ContactTable from '../mainApp/default/ContactTable'
import EmployeeTable from '../mainApp/default/EmployeeTable'
import PersonTable from '../mainApp/default/PersonTable'
import SessionTable from '../mainApp/default/SessionTable'
import SetupTable from '../mainApp/default/SetupTable'
import UserTable from '../mainApp/default/UserTable'
import DefaultPrivilegeTable from '../mainApp/default/DefaultPrivilegeTable'
import ManufacturerTable from '../mainApp/default/ManufacturerTable'
import ServiceTable from '../mainApp/default/ServiceTable'
import BankTable from '../mainApp/default/BankTable'
import DepartmentTable from '../mainApp/default/DepartmentTable'
import EmployeeBankTable from '../mainApp/default/EmployeeBankTable'
import NotificationTable from '../mainApp/default/NotificationTable'
import NotificationSettings from '../mainApp/default/NotificationSettingsTable'

export const AppDefaultModelList:iModelList[] = [
    {
        tableName: 'SessionTable',
        tableDescription: new SessionTable().tableDescription()
    },
    {
        tableName: 'PersonTable',
        tableDescription: new PersonTable().tableDescription()
    },
    {
        tableName: 'AddressTable',
        tableDescription: new AddressTable().tableDescription()
    },
    {
        tableName: 'ContactTable',
        tableDescription: new ContactTable().tableDescription()
    },
    {
        tableName: 'BusinessTable',
        tableDescription: new BusinessTable().tableDescription()
    },
    {
        tableName: 'SetupTable',
        tableDescription: new SetupTable().tableDescription()
    },
    {
        tableName: 'EmployeeBankAccount',
        tableDescription: new EmployeeBankTable().tableDescription()
    },
    {
        tableName: 'EmployeeTable',
        tableDescription: new EmployeeTable().tableDescription()
    },
    {
        tableName: 'UserTable',
        tableDescription: new UserTable().tableDescription()
    },
    {
        tableName: 'DefaultPrivilegeTable',
        tableDescription: new DefaultPrivilegeTable().tableDescription()
    },
    {
        tableName: 'ManufacturerTable',
        tableDescription: new ManufacturerTable().tableDescription()
    },
    {
        tableName: 'ServiceTable',
        tableDescription: new ServiceTable().tableDescription()
    },
    {
        tableName: 'BankTable',
        tableDescription: new BankTable().tableDescription()
    },
    {
        tableName: 'DepartmentTable',
        tableDescription: new DepartmentTable().tableDescription()
    },
    {
        tableName: 'NotificationTable',
        tableDescription: new NotificationTable().tableDescription()
    },
    {
        tableName: 'NotificationSettings',
        tableDescription: new NotificationSettings().tableDescription()
    }
]


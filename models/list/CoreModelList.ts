import { iModelList } from '../../modules/interfaces/iMigration'
import BusinessDatabaseTable from '../core/BusinessDatabaseTable'
import BusinessOwnerTable from '../core/BusinessOwnerTable'
import BusinessTable from '../core/BusinessTable'
import SoftwarePackageTable from '../core/SoftwarePackageTable'
import SoftwarePurchaseTable from '../core/SoftwarePurchaseTable'


export const CoreModelList:iModelList[] = [
    {
        tableName: 'BusinessTable',
        tableDescription: new BusinessTable().tableDescription()
    },
    {
        tableName: 'BusinessOwnerTable',
        tableDescription: new BusinessOwnerTable().tableDescription()
    },
    {
        tableName: 'BusinessDatabaseTable',
        tableDescription: new BusinessDatabaseTable().tableDescription()
    },
    {
        tableName: 'SoftwarePackageTable',
        tableDescription: new SoftwarePackageTable().tableDescription()
    },
    {
        tableName: 'SoftwarePurchaseTable',
        tableDescription: new SoftwarePurchaseTable().tableDescription()
    }
]


import { iSystemModelList } from "../../modules/interfaces/iMigration"
import { AppDefaultModelList } from "./AppDefaultModelList"
import { CustomerRelationshipManagementModelList, InventoryModelList, MiniAccountModelList, HumanResourceManagementModelList, PointOfSaleModelList} from "./AppFeaturesModelList"
import { CoreModelList } from "./CoreModelList"


const AllSystemModelLists:iSystemModelList = {
    OvasyteCore: CoreModelList,
    AppDefault: AppDefaultModelList,
    CustomerRelationshipManagement: CustomerRelationshipManagementModelList,
    Inventory: InventoryModelList,
    MiniAccount: MiniAccountModelList,
    POS: PointOfSaleModelList,
    HumanResourceManagement: HumanResourceManagementModelList
}


export default AllSystemModelLists


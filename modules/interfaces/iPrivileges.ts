import { iCRMPrivilege } from "./crm/iCRMPrivilege"
import { iDefaultPrivilege } from "./default/iDefaultPrivilege"
import { iInventoryPrivilege } from "./inventory/iInventoryPrivilege"
import { iMiniAccountPrivilege } from "./miniAccount/iMiniAccountPrivileges"
import { iHRPrivilege } from "./hr/iHRPrivilege"
import { iPOSPrivilege } from "./pos/iPOSPrivilege"


export interface iPrivileges {
    Default?: iDefaultPrivilege
    CRM?: iCRMPrivilege
    Inventory?: iInventoryPrivilege
    MiniAccount?: iMiniAccountPrivilege
    HR?: iHRPrivilege
    POS?: iPOSPrivilege
}

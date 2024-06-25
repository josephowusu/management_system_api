
export interface iCreateTableColumn {
    columnName:string
    dataType:string
    primaryKey?:boolean
    notNull?:boolean
}

export interface iAlterTableColumn {
    columnName:string
    dataType:string
    afterColumnName?:string
    addOrDrop:'add'|'drop'
}

export interface iAlterForeignKeyColumn {
    columnName:string
    keyName:string
    referenceTable:string
    addOrDrop:'add'|'drop'
}

export interface iGetCreateTableDetails {
    tableName:string
    columns:iCreateTableColumn[]
    alterColumns:iAlterTableColumn[]
    foreignKeys:iAlterForeignKeyColumn[]
}

export interface iModelList {
    tableName:string
    tableDescription:iGetCreateTableDetails
}

export interface iMySQLResponseObject {
    affectedRows:number
    changedRows:number
    fieldCount:number
    insertId:number
    message:string
    protocol41:boolean
    serverStatus:number
    warningCount:number
}

export interface iSystemModelList {
    OvasyteCore:iModelList[]
    AppDefault:iModelList[]
    CustomerRelationshipManagement:iModelList[]
    Inventory:iModelList[]
    MiniAccount:iModelList[]
    POS:iModelList[]
    HumanResourceManagement:iModelList[]
}

export type iSystemModelListValues = 'OvasyteCore'|'AppDefault'|'CustomerRelationshipManagement'|'Inventory'|'MiniAccount'|'POS'


export interface iModelClass {

    save:() => Promise<'exist'|'error'|'success'|'empty'>

    update:(columnsToUpdate:any[]) => Promise<'exist'|'error'|'success'|'empty'>

    get:(search:string, values:string[], limit:number, offset:number) => Promise<any[]>

    getAll:(limit:number, offset:number) => Promise<any[]>

    tableDescription:() => iGetCreateTableDetails

}
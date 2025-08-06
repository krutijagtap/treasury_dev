using com.scb.treasury as treasury from '../db/schema';

service CatalogService {
    @readonly
    entity Books            as projection on treasury.Books;

    type ReturnType : {
        status       : String(20);
        errorMessage : String;
    };

            // @odata.draft.enabled
    @(requires: 'authenticated-user')
            @UI.CreateHidden                  : true
            @UI.DeleteHidden                  : true
            @UI.UpdateHidden                  : true
    entity Content          as projection on treasury.Content
                               // select from treasury.Content {
                               //     *,
                               //     summaryFiles as summaryFiles
                               // }
        actions {
            @cds.odata.bindingparameter.name  : '_it'
            @sap.fe.core.RefreshAfterExecution: true
            action approveContent() returns Content;

            @cds.odata.bindingparameter.name  : '_it'
            @sap.fe.core.RefreshAfterExecution: true
            action rejectContent()  returns Content;

            @cds.odata.bindingparameter.name  : '_it'
            @sap.fe.core.RefreshAfterExecution: true
            action deleteContent()  returns ReturnType;

            @cds.odata.bindingparameter.name  : '_it'
            @sap.fe.core.RefreshAfterExecution: true
            action submit()         returns Content;
            
                  };

    entity SummaryFiles     as projection on treasury.SummaryFiles;
    entity ContentStatus    as projection on treasury.ContentStatus;
    entity EmbeddingStatus  as projection on treasury.EmbeddingStatus;
    entity TagTypes         as projection on treasury.TagTypes;
    entity ActionVisibility as projection on treasury.ActionVisibility;
    action createContent(initialData : String) returns String;
    action chatResponse(prompt : String)       returns String;
    entity MetaDataForFiles as projection on treasury.MetaDataForFiles;
    //action showMetaData() returns String;
 // action showMetaData() for MetaDataForFiles;

}

using com.scb.treasury as treasury from '../db/schema';

service CatalogService {
    @readonly
    entity Books            as projection on treasury.Books;

    type ReturnType : {
        message : String;
    };

            // @odata.draft.enabled
    @(requires: 'authenticated-user')
            @UI.CreateHidden                  : true
            @UI.DeleteHidden                  : true
            @UI.UpdateHidden                  : true
    // entity Content          as projection on treasury.Content
    entity Content          as
        select from treasury.Content {
            *,

            metaData,
            @UI.Hidden: true
            @UI.HiddenFilter: true
            virtual canApprove : Boolean @Core.Computed,
            @UI.Hidden: true
            @UI.HiddenFilter: true
            virtual canDelete : Boolean @Core.Computed
        }
        actions {
            @cds.odata.bindingparameter.name  : '_it'
            @sap.fe.core.RefreshAfterExecution: true
            action approveContent() returns Content;

            @cds.odata.bindingparameter.name  : '_it'
            @sap.fe.core.RefreshAfterExecution: true
            action rejectContent()  returns Content;

            @cds.odata.bindingparameter.name  : '_it'
            @sap.fe.core.RefreshAfterExecution: true
            action deleteContent()  returns Content;

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
//action showMetaData() returns String;
// action showMetaData() for MetaDataForFiles;

}

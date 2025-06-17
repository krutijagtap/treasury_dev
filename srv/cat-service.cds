using com.scb.treasury as treasury from '../db/schema';

service CatalogService {
    @readonly
    entity Books           as projection on treasury.Books;

    type ReturnType : {
        status       : String(20);
        errorMessage : String;
    };

    @odata.draft.enabled
    @(requires: 'authenticated-user')
    @UI.CreateHidden : true
    entity Content         as
        select from treasury.Content {
            *
        }
        actions {
            @cds.odata.bindingparameter.name: '_it'
            action approveContent() returns ReturnType;

            @cds.odata.bindingparameter.name: '_it'
            action rejectContent()  returns ReturnType;

            @cds.odata.bindingparameter.name: '_it'
            action submit()         returns Content;
        };

    entity SummaryFiles    as projection on treasury.SummaryFiles;
    entity ContentStatus   as projection on treasury.ContentStatus;
    entity EmbeddingStatus as projection on treasury.EmbeddingStatus;
    entity TagTypes        as projection on treasury.TagTypes;
    action createContent(initialData : String) returns String;

}

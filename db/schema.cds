namespace com.scb.treasury;

using {
  sap.common.CodeList,
  cuid,
  managed
} from '@sap/cds/common';

entity Books {
  key ID    : Integer;
      title : String;
      stock : Integer;
}

entity Content : managed {
      @UI.AdaptationHidden: true
  key ID              : String;

      @UI.AdaptationHidden: true
      @Common.Label : 'File Name'
      fileName        : String;
      mediaType       : String;

      @UI.AdaptationHidden: true
      tagType         : String;
      //Association to TagTypes;
      status          : String;

      //Association to ContentStatus;
      @UI.AdaptationHidden: true
      embeddingStatus : String;

      //Association to EmbeddingStatus;
      @UI.AdaptationHidden: true
      url             : String;

      @Core.MediaType     : mediaType
      content         : LargeBinary;

      @UI.AdaptationHidden: true
      summaryFiles    : Composition of many SummaryFiles
                          on summaryFiles.content = $self;

      @UI.AdaptationHidden: true
      metaData        : LargeString;

      @UI.AdaptationHidden: true
      isChecker       : Boolean;
}

entity SummaryFiles : cuid, managed {
  fileName    : String;
  url         : String;
  fileContent : LargeString;
  content     : Association to Content;
}

entity TagTypes : CodeList {
  key code : String;
      name : String;
}

entity ContentStatus : CodeList {
  key code : String;
      name : String;
}

entity EmbeddingStatus : CodeList {
  key code : String;
      name : String;
}

@odata.singleton
entity ActionVisibility : cuid, {
  isChkr  : Boolean default false;
  isMaker : Boolean default false;
}

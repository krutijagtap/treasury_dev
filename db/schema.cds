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
  key ID              : String;
      fileName        : String;
      mediaType       : String;
      tagType         : Association to TagTypes;
      status          : Association to ContentStatus;
      embeddingStatus : Association to EmbeddingStatus;
      url             : String;

      @Core.MediaType: mediaType
      content         : LargeString;
      summaryFiles    : Composition of many SummaryFiles
                          on summaryFiles.content = $self;
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
  isChkr : Boolean default false;
  isMaker   : Boolean default false;
}

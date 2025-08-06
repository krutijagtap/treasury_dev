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
      tagType         : String;
      //Association to TagTypes;
      status          : String;
      //Association to ContentStatus;
      embeddingStatus : String;
      //Association to EmbeddingStatus;
      url             : String;

      @Core.MediaType: mediaType
      content         : LargeBinary;
      summaryFiles    : Composition of many SummaryFiles
                          on summaryFiles.content = $self;
     metaData        : Composition of one MetaDataForFiles
        on metaData.fileName = $self.fileName;
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

entity MetaDataForFiles : cuid, managed {
    fileName    : String;
     metaData : LargeString;
   
}


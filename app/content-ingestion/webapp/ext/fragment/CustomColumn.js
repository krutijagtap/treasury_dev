sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
], function(MessageToast,Fragment) {
    'use strict';

    return {
        onPress: function(oEvent) {
            MessageToast.show("Custom handler invoked.");
            var that = this;
        //  const metaData = response.metadata;
       
          const jsonResponse = { header: {
            contributor: "",
            creator: "",
            description: "",
           
          },
          technical: {
            fileExtension: "",
            fileFormat: "",
            mimeType: "",
          },
          additional: {
            accessLevel: "",
            auditTrail: "",
            documentInfo: {
              type: "",
            
            }}}
         /* const jsonResponse = {
            header: {
              contributor: metaData.contributor,
              creator: metaData.creator,
              description: metaData.description,
              language: metaData.language,
              publisher: metaData.publisher,
              rights: metaData.rights,
              subject: metaData.subject,
              title: metaData.title
            },
            technical: {
              fileExtension: metaData.file_extension,
              fileFormat: metaData.file_format,
              mimeType: metaData.mime_type
            },
            additional: {
              accessLevel: metaData.access_level,
              auditTrail: metaData.audit_trail[0],
              documentInfo: {
                type: metaData.dc_type,
                documentDate: metaData.document_date,
                extractionTool: metaData.extraction_tool
              }
            }
          };*/
          this.iProgress = 0;
          if (!this._oDialog) {
            this._pDialog = Fragment.load({
              id: this.getView().getId(),
              name: "com.scb.treasury.contentingestion.fragment.MyDialog",
              controller: this
            }).then(function (oDialog) {
              that._oDialog = oDialog;
              that.getView().addDependent(oDialog);
          //    that._populateJsonData(jsonResponse);
              that._oDialog.open();
            });
          } else {
        //    that._populateJsonData(jsonResponse);
            this._oDialog.open();
          }
          return true;
        },
        onCloseDialog: function () {
            this._oDialog.close();
          },
    };
});

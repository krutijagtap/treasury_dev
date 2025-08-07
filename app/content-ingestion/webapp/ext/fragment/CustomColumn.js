sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/core/Fragment",
], function(MessageToast,Fragment) {
  'use strict';

  return {
      onPress: function(oEvent) {
          MessageToast.show("Custom handler invoked.");
          var that = this;
         
          const oContext = oEvent.getSource().getBindingContext();
          const oView = this.editFlow.getView();
          const oModel = oView.getModel();
    
          const sPath = oContext.getPath();
          const oMetadata = oContext.requestObject("metaData");
        
        
          const oModelMet = new sap.ui.model.json.JSONModel(oMetadata);

          const metaData = oModelMet.getData(); 
          MessageToast.show(metaData);
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
            id: this.editFlow.getView(),
            name: "com.scb.treasury.contentingestion.fragment.MyDialog",
            controller: this
          }).then(function (oDialog) {
            that._oDialog = oDialog;
            that.getView().addDependent(oDialog);
          that._populateJsonData(metaData);
            that._oDialog.open();
          });
        } else {
         that._populateJsonData(metaData);
          this._oDialog.open();
        }
        return true;
      },
      _populateJsonData: function (data) {
        const oViewId = this.editFlow.getView().getId();
        const oHeaderBox = Fragment.byId(oViewId, "headerSection");
        const oTechBox = Fragment.byId(oViewId, "technicalSection");
        const oAdditionalBox = Fragment.byId(oViewId, "additionalSection");
        // Clear old
        [oHeaderBox, oTechBox, oAdditionalBox].forEach(box => {
          const items = box.getItems().slice(1); // keep title label
          items.forEach(item => box.removeItem(item));
        });
        const createRow = (key, value) => new HBox({
          items: [
            new Label({ text: key + ":", design: "Bold", wrapping: true }),
            new Text({ text: value || "Not available", wrapping: true, class: "sapUiTinyMarginBegin" })
          ],
          class: "sapUiSmallMarginBottom"
        });
        // Populate Header
        Object.entries(data.header).forEach(([key, val]) => oHeaderBox.addItem(createRow(key, val)));
        // Technical Details
        Object.entries(data.technical).forEach(([key, val]) => oTechBox.addItem(createRow(key, val)));
        // Additional Fields
        // Object.entries(data.additional).forEach(([key, val]) => oAdditionalBox.addItem(createRow(key, val)));
        Object.entries(data.additional).forEach(([key, val]) => {
          if (typeof val === "object" && val !== null) {
            // Flatten sub-fields
            Object.entries(val).forEach(([subKey, subVal]) => {
              oAdditionalBox.addItem(createRow(`${key}.${subKey}`, subVal));
            });
          } else {
            oAdditionalBox.addItem(createRow(key, val));
          }
        });
      },
      onCloseDialog: function () {
          this._oDialog.close();
        },
  };
});
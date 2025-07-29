
sap.ui.define(
  [
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "sap/ui/core/Fragment",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/HBox",
    "sap/m/Panel",
    "sap/m/VBox" ,
    "./service",
  ],
  function (ControllerExtension, MessageBox, BusyIndicator,Fragment,Label,Text,HBox,Panel,VBox,service) {
    "use strict";

    return ControllerExtension.extend(
      "com.scb.treasury.contentingestion.controller.CustomExpandedHeader",
      {
        onInit: function () {},

        /**
         * Returns the base URL of the Component
         */
        _getBaseURL: function () {
          const sComponentId = sap.ui.core.Component.getOwnerComponentFor(
            this.base.getView()
          )
            .getManifestEntry("/sap.app/id")
            .replaceAll(".", "/");
          return sap.ui.require.toUrl(sComponentId);
        },
        onfetchCSRF: async function(url){
          const response = await fetch(url, {
            method: "HEAD",
            credentials: "include",
            headers: {
                "X-CSRF-Token": "Fetch"
            }
        });
        const token = response.headers.get("X-CSRF-Token");
        if (!token) {
            throw new Error("Failed to fetch CSRF token");
        }
        return token;
        }, 
        
      onfetchData: async function (oFile) {
        // const chatUrl =  sap.ui.require.toUrl('com/scb/treasury/contentingestion')+ "/api/upload";
        const chatUrl =  "/api/upload";
        const csrfUrl =  sap.ui.require.toUrl('com/scb/treasury/contentingestion');
        // const csrf = await this.onfetchCSRF(csrfUrl);
        console.log(oFile);
        let formData = new FormData();
        formData.append("file", oFile);
        try {  
          const response = await fetch(chatUrl, {
               method: "POST",
              //  headers: { 
              //   //  "X-CSRF-Token":csrf,
              //  },
               body: formData
           });
           if (!response.ok) {          
             sap.m.MessageToast.show(response.message);
             return;
            }
          return response;
          }             
          catch (error) {
           console.error("API Error:", error);
       }          
     },
        /**
         * Get i18n text by key
         */
        _getText: function (sTextId, aArgs) {
          return this.base
            .getOwnerComponent()
            .getModel("i18n")
            .getResourceBundle()
            .getText(sTextId, aArgs);
        },

        /**
         * File type validation and assignment
         */
        onFileChange: function (oEvent) {
          const oFileUploader = oEvent.getSource();
          const file = oEvent.getParameter("files")[0];

          if (!file || file.type !== "application/pdf") {
            MessageBox.error(this._getText("fileTypeError"));
            oFileUploader.setValue("");
            return;
          }

          this.file = file;
        },

        /**
         * Calculate SHA-256 hash of a file
         */
        calculateFileHash: async function (file) {
          const arrayBuffer = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        },

        /**
         * Handles file upload and prepares payload
         */ onOpenDialog: function () {
          var that = this;
          const jsonResponse = {
            header: {
              contributor: "Not available",
              creator: "Citigroup",
              description: "Not available",
              language: "en-US",
              publisher: "Not available",
              rights: "Not available",
              subject: "Not available",
              title: "SECOND QUARTER 2025 RESULTS AND KEY METRICS"
            },
            technical: [
              { itemId: "1001", description: "Product A" }           
            ],
            additional: {
              accessLevel: "Public",
              auditTrail: {
                action: "Created",
                extractor: "LLM",
                timestamp: "2025-07-16T06:00:06.195Z"
              },
              documentInfo: {
                type: "Text",
                documentDate: "2025-07-14T17:19:02Z",
                extractionTool: "Enhanced Dublin Core Extractor v3.0"
              }
          }};
          this.iProgress = 0;
          if (!this._oDialog) {
            this._pDialog =   Fragment.load({
                  id: this.getView().getId(),
                  name: "com.scb.treasury.contentingestion.fragment.MyDialog",
                  controller: this
              }).then(function (oDialog) {
                  that._oDialog = oDialog;
                  that.getView().addDependent(oDialog);
                  that._populateJsonData(jsonResponse);
                  that._oDialog.open();
              });
          } else {
            that._populateJsonData(jsonResponse);
              this._oDialog.open();            
          }
      },

      onCloseDialog: function () {
          this._oDialog.close();
      },
        onUploadFile: async function () {
          try {
            BusyIndicator.show(0);
            sap.m.MessageToast.show("opening dialog box");
            this.onOpenDialog();
            const oFileUploader = this.base.byId("__fileUploader");
            const oFile = oFileUploader.getDomRef("fu").files[0];
           
            const isQASelected = this.base.byId("__checkboxQA").getSelected();
            const isSummarySelected = this.base
              .byId("__checkboxSummary")
              .getSelected();

            if (!isQASelected && !isSummarySelected) {
              sap.m.MessageToast.show("Please select at least one checkbox.");
              return;
            }

            if (!oFile) {
              sap.m.MessageToast.show("Please select a file to upload.");
              return;
            }
            const response =this.onfetchData(oFile);
            if(response.metadata.processing_decision == "REJECTED")
              return;
            else{const fileHash = await this.calculateFileHash(oFile);
              const sFileName = oFile.name;
              const sMimeType = oFile.type;
              const sContentUrl = `./v2/odata/v4/catalog/Content('${fileHash}')/content`;
  
              const aPayloads = [];
    
              if (isQASelected) {
                aPayloads.push({
                  keyID: `QA_${fileHash}`,
                  fileName: sFileName,
                  mediaType: sMimeType,
                  tagType: "QA",
                  status: "SUBMITTED",
                  url: sContentUrl,
                });
              }
  
              if (isSummarySelected) {
                aPayloads.push({
                  keyID: `SUM_${fileHash}`,
                  fileName: sFileName,
                  mediaType: sMimeType,
                  tagType: "SUMMARY",
                  status: "DRAFT",
                  url: sContentUrl,
                });
              }
  
              if (oFileUploader.getValue()) {
                oFileUploader.setValueState("None");
                await this._postInitialFileRecord(aPayloads);
  
                oFileUploader.setValue("");
                this.base.byId("__checkboxQA").setSelected(false);
                this.base.byId("__checkboxSummary").setSelected(false);
              } else {
                oFileUploader.setValueState("Error");
              }}
            
          } catch (error) {
            console.error(error);
            MessageBox.error(this._getText("fileUploadError"), {
              details: error,
            });
          } finally {
            BusyIndicator.hide();
          }
        },

        /**
         * Reads a file and returns its base64 string
         */
        _readFileAsBase64: function (file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result.split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        },

        /**
         * Calls CAP action and refreshes ListReport model
         */
        _postInitialFileRecord: async function (aPayloads) {
          try {
            const oModel = this.getView().getModel();

            const response = await service.createContent(
              this.base,
              { initialData: JSON.stringify(aPayloads) },
              "CatalogService.EntityContainer/createContent",
              oModel
            );

            if (response) {
              const oExtModel = this.base.getExtensionAPI().getModel();
              oExtModel.refresh();
            }
          } catch (error) {
            this._handleException(error, "_postInitialInvoiceRecord");
          }
        },

        /**
         * Generic error handler
         */
        _handleException: function (error, location) {
          const errorObj =
            error instanceof Error
              ? {
                  "Error Location": location,
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : {
                  "Error Location": location,
                  ...error,
                };

          console.error("Handled Error:", errorObj);
          MessageBox.error("An unexpected error occurred.");
        },
        _populateJsonData: function (data) {
          const oViewId = this.getView().getId();
          const oHeaderBox = Fragment.byId(oViewId, "headerSection");
          const oTechBox = Fragment.byId(oViewId, "technicalSection");
          const oAdditionalBox = Fragment.byId(oViewId, "additionalSection");
        
          // Clear old
          [oHeaderBox, oTechBox, oAdditionalBox].forEach(box => {
            const items = box.getItems().slice(1); // keep title label
            items.forEach(item => box.removeItem(item));
          });
        
          const createRow = (key, value) => new VBox({
            items: [
              new Label({ text: key + ":", design: "Bold", wrapping: true }),
              new Text({ text: value || "Not available", wrapping: true })
            ],
            class: "sapUiSmallMarginBottom"
          });
        
          // Populate Header
          Object.entries(data.header).forEach(([key, val]) => oHeaderBox.addItem(createRow(key, val)));
        
          // Technical Details
          Object.entries(data.technical).forEach(([key, val]) => oTechBox.addItem(createRow(key, val)));
        
          // Additional Fields
          Object.entries(data.additional).forEach(([key, val]) => oAdditionalBox.addItem(createRow(key, val)));
        },
        
      }
    );
  }
);

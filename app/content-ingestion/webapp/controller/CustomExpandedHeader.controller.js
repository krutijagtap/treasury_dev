
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
    "sap/m/VBox",
    "./service",
  ],
  function (ControllerExtension, MessageBox, BusyIndicator, Fragment, Label, Text, HBox, Panel, VBox, service) {
    "use strict";

    return ControllerExtension.extend(
      "com.scb.treasury.contentingestion.controller.CustomExpandedHeader",
      {
        onInit: function () {
          let oModel = new sap.ui.model.json.JSONModel();
          this.getView().setModel(oModel);
        },

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
        onfetchCSRF: async function (url) {
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
          const chatUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion') + "/api/upload";
          // const chatUrl = "/api/upload";
          const baseUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion');
          const csrf = await this.onfetchCSRF(baseUrl);
          console.log(oFile);
          let formData = new FormData();
          formData.append("file", oFile);
          try {
            const response = await fetch(chatUrl, {
              method: "POST",
              headers: {
                "X-CSRF-Token": csrf,
              },
              body: formData
            });
            if (!response.ok) {
              sap.m.MessageToast.show(response.message);
              return;
            }
            const json = await response.json();
            return json;
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
         */
        onOpenDialog: function (response) {
          var that = this;
          const metaData = response.metadata;
          if (!metaData) {
            return;
          }
          const jsonResponse = {
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
          };
          this.iProgress = 0;
          if (!this._oDialog) {
            this._pDialog = Fragment.load({
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
          return true;
        },

        onCloseDialog: function () {
          this._oDialog.close();
        },
        onUploadFile: async function () {
          try {
            BusyIndicator.show(0);
            sap.m.MessageToast.show("opening dialog box");
            const oFileUploader = this.base.byId("__fileUploader");
            const oFile = oFileUploader.getDomRef("fu").files[0];
            const baseUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion');
            const chatUrl = baseUrl + "/api/upload";
            const csrf = await this.onfetchCSRF(baseUrl);
            console.log(oFile);
            let formData = new FormData();
            formData.append("file", oFile);

            const isQASelected = this.base.byId("__checkboxQA").getSelected();
            const isSummarySelected = this.base
              .byId("__checkboxSummary")
              .getSelected();

            // if (!isQASelected && !isSummarySelected) {
            //   sap.m.MessageToast.show("Please select at least one checkbox.");
            //   return;
            // }

            if (!oFile) {
              sap.m.MessageToast.show("Please select a file to upload.");
              return;
            }
            // get the API response
            const responseAPI = await fetch(chatUrl, {
              method: "POST",
              headers: {
                "X-CSRF-Token": csrf,
              },
              body: formData
            });
            if (!responseAPI.ok) {
              sap.m.MessageToast.show(responseAPI.message);
              return;
            }
            const json = await responseAPI.json();
            const dialog = await this.onOpenDialog(json);
            // this.getView().byId("decisionText").setText(response.metadata.processing_decision);
            if (dialog) {
            // if (json.metadata.processing_decision == "REJECTED")
            //   return;
            // else {
            const fileHash = await this.calculateFileHash(oFile);
            const sFileName = oFile.name;
            const sMimeType = oFile.type;
            const sContentUrl = `/Content(ID='${fileHash}',IsActiveEntity=true)/content`;
            const oModel = this.getView().getModel();

            const aPayloads = [];

            aPayloads.push({
              keyID: `${fileHash}`,
              fileName: sFileName,
              mediaType: sMimeType,
              status: "SUBMITTED",
              url: sContentUrl
            });

            if (oFileUploader.getValue()) {
              oFileUploader.setValueState("None");
              const putUrl = baseUrl + "/odata/v4/catalog/Content/" + fileHash + "/content"; ///odata/v4/catalog
              const contentUrl = baseUrl + "/odata/v4/catalog/Content"; ///odata/v4/catalog
              // const response = await service.createContent(
              //   this.base,
              //   { initialData: JSON.stringify(aPayloads) },
              //   "CatalogService.EntityContainer/createContent",
              //   oModel
              // );

              // create a record in Content Table
              const response = await fetch(contentUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-CSRF-Token": csrf
                },
                credentials: "include",
                body: JSON.stringify({
                  "ID": `${fileHash}`,
                  fileName: oFile.name,
                  "url": "/odata/v4/catalog/Content/" + fileHash + "/content",
                  status: "SUBMITTED"
                })
              });

              if (!response.ok) {
                if (response.status === 400) {
                  sap.m.MessageToast.show("400-Bad Request");
                  return
                } else {
                  throw new Error(`Entity creation failed: ${response.status}`);
                }
              }

              const oExtModel = this.base.getExtensionAPI().getModel();
              await fetch(putUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": oFile.type,
                  "Slug": encodeURIComponent(oFile.name),
                  "X-CSRF-Token": csrf
                },
                credentials: "include",
                body: oFile
              });
              oExtModel.refresh();
              oFileUploader.setValue("");
            } else {
              oFileUploader.setValueState("Error");
            }
            // }


            // const oExtModel = this.base.getExtensionAPI().getModel();
            // await fetch(putUrl, {
            //   method: "PUT",
            //   headers: {
            //     "Content-Type": oFile.type,
            //     // "Slug": encodeURIComponent(oFile.name),
            //     "X-CSRF-Token": csrf
            //   },
            //   credentials: "include",
            //   body: oFile
            // });
            // oExtModel.refresh();
            //   oFileUploader.setValue("");
            // } else {
            //   oFileUploader.setValueState("Error");
            // }
            // }
          }

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
        _postInitialFileRecord: async function (aPayloads, oFile, fileHash) {
          try {
            const oModel = this.getView().getModel();
            const putUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion') + "Content('" + fileHash + "')/content"
            const response = await service.createContent(
              this.base,
              { initialData: JSON.stringify(aPayloads) },
              "CatalogService.EntityContainer/createContent",
              oModel
            );

            if (response) {
              const oExtModel = this.base.getExtensionAPI().getModel();
              await fetch(putUrl, {
                method: "PUT",
                headers: {
                  "Content-Type": oFile.type,
                  "Slug": encodeURIComponent(oFile.name),
                  "X-CSRF-Token": csrfToken
                },
                credentials: "include",
                body: oFile
              });
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
      }
    );
  }
);

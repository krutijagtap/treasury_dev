
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
        override: {
          onInit() {
            this.onfetchRoles();
            const oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "viewModel");
            this.getView().getModel("viewModel").setProperty("/decision");
          },

        }
        ,
        onTypeMismatch: function () {
          MessageBox.error("Only pdf, docx, xlsx files are allowed");
        },
        /**
         * Returns the base URL of the Component
         */
        onfetchRoles: async function (params) {
          //  const oComponent = this.getOwnerComponent();
          const baseUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion');
          const url = baseUrl + "/user-api/currentUser";

          try {
            const response = await fetch(url, {
              method: "GET",
              headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const roles = data.scopes;

            const hasScopeForChecker = roles.some(role => role.includes("ContentChecker"));
            const hasScopeForMaker = roles.some(role => role.includes("ContentMaker"));

            // Create a new authModel for this controller
            const authModel = new sap.ui.model.json.JSONModel({
              isAdmin: hasScopeForChecker,   // <-- simple boolean
              isViewer: hasScopeForMaker     // (optional) if you also want view-only rights
            });

            this.getView().setModel(authModel, "authModel");  // set the model with a named model

            console.log("Auth model created:", authModel.getData());

          } catch (error) {
            console.error("API Error:", error);
          }
        },
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
          console.log("Inside File Change");
          const oFileUploader = oEvent.getSource();
          const file = oEvent.getParameter("files")[0];

          // if (!file || file.type !== "application/pdf") {
          //   MessageBox.error(this._getText("fileTypeError"));
          //   oFileUploader.setValue("");
          //   return;
          // }
          if (file) {
            console.log("File selected: ", file.name);
          }
          // }
          // this.file = file;
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
          var metaData = response.metadata;
          if (!metaData) {
            return;
          }
          metaData["filename"] = response.filename;

          this.getView().getModel("viewModel").setData(metaData);
          // this.iProgress = 0;
          if (!this._oDialog) {
            this._pDialog = Fragment.load({
              id: this.getView().getId() + "--myDialog",
              name: "com.scb.treasury.contentingestion.fragment.MyDialog",
              controller: this
            }).then(function (oDialog) {
              that._oDialog = oDialog;
              that.getView().addDependent(oDialog);
              // that._populateJsonData(jsonResponse);
              that._oDialog.open();
            });
          }
          else {
            that._oDialog.open();
          }
          return true;
        },

        onCloseDialog: function () {
          this._oDialog.close();
        },
        onUploadFile: async function (oEvent) {
          try {
            BusyIndicator.show(0);
            const oFileUploader = this.base.byId("__fileUploader");
            const oFile = oFileUploader.getDomRef("fu").files[0];
            const baseUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion');

            const chatUrl = baseUrl + "/api/upload";
            const contentUrl = baseUrl + "/odata/v4/catalog/Content";
            const csrf = await this.onfetchCSRF(baseUrl);
            console.log(oFile);
            let formData = new FormData();
            formData.append("file", oFile);


            if (!oFile) {
              sap.m.MessageToast.show("Please select a file to upload.");
              return;
            }

            //check for duplicate file
            const resDuplicate = await fetch(contentUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrf
              },
              credentials: "include",
            });
            const dupl = await resDuplicate.json();
            var flag;
            if (dupl.value && dupl.value.length > 0) {
              dupl.value.forEach(record => {
                if (record.fileName == oFile.name) {
                  MessageBox.warning(`File '${oFile.name}' already exists!`);
                  flag = true;
                }
              })
              if (flag)
                return;
            }

            sap.m.MessageToast.show("opening dialog box");
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
            const decision = json.metadata.processing_decision;
            this.getView().getModel("viewModel").setProperty("/decision", decision)
            if (dialog) {
              if (decision == "REJECTED")
                return;
              else {
                const fileHash = await this.calculateFileHash(oFile);
                const putUrl = baseUrl + "/odata/v4/catalog/Content/" + fileHash + "/content"; ///odata/v4/catalog

                const metadata = json.metadata;

                if (oFileUploader.getValue()) {
                  oFileUploader.setValueState("None");

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
                      "url": putUrl,
                      status: "SUBMITTED",
                      metaData: JSON.stringify({ metadata })
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
                  const metadataRes = await this.saveMetaData(csrf, json.metadata, oFile.name);
                  const oExtModel = this.base.getExtensionAPI().getModel();
                  var fileType;
                  if(oFile.type.includes("pdf"))
                    fileType = 'PDF'
                  else if(oFile.type.includes("spreadsheet"))
                    fileType = 'Excel'
                  else
                    fileType = 'Document/Word'
                  await fetch(putUrl, {
                    method: "PUT",
                    headers: {
                      "Content-Type": fileType,
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
              }
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
        saveMetaData: function (csrf, json, fileName) {
          const contentUrlmet = sap.ui.require.toUrl('com/scb/treasury/contentingestion') + "/odata/v4/catalog/MetaDataForFiles";
          const response = fetch(contentUrlmet, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrf
            },
            credentials: "include",
            body: JSON.stringify({
              "fileName": fileName,
              "metaData": JSON.stringify({ json })
            })
          });

          return response;
        }

      }
    );
  }
);

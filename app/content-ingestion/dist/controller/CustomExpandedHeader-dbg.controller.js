sap.ui.define(
  [
    "sap/ui/core/mvc/ControllerExtension",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    "./service",
  ],
  function (ControllerExtension, MessageBox, BusyIndicator, service) {
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
        onUploadFile: async function () {
          try {
            BusyIndicator.show(0);

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

            const fileHash = await this.calculateFileHash(oFile);
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
      }
    );
  }
);

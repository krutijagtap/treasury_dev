sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/m/PDFViewer",
  "sap/m/BusyDialog",
  "sap/m/MessageToast"
], (Controller, MessageBox, PDFViewer, BusyDialog, MessageToast) => {
  "use strict";

  return Controller.extend("treasuryui.controller.TreasuryMainView", {
    onInit() {
      let oModel = new sap.ui.model.json.JSONModel();
      this.getView().setModel(oModel);
    },
    getBaseURL: function () {
      var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
      var appPath = appId.replaceAll(".", "/");
      var appModulePath = jQuery.sap.getModulePath(appPath);
      return appModulePath;
    },
    onfetchCSRF: async function (url) {
      const response = await fetch(url, {
        method: "GET",
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
    onSelectDocument: function (oEvent) {
      var oMultiBox = oEvent.getSource();
      var aSelectedItems = oMultiBox.getSelectedItems();
      var aFiles = aSelectedItems.map(function (element) {
        return "File: " + element.getText(); //or getKey, whatever holds the correct data
      });
      aFiles.push("Question: ");
      var sFormattedPrompt = aFiles.join("\n");
      this.byId("chatFeedInput").setValue(sFormattedPrompt);
    },

    onUserChat: async function () {
      const chatModel = this.getOwnerComponent().getModel("chatModel");
      const oView = this.getView();
      const sInput = this.byId("chatFeedInput").getValue();

      // Disable submit + hide previous result
      chatModel.setSubmit(false);
      chatModel.setvisibleResult(false);

      // Create and show busy dialog
      const oBusyDialog = new sap.m.BusyDialog({
        title: "Busy Indicator",
        text: "Generating response. Please standby.."
      });
      oBusyDialog.open();

      // Freeze the screen
      oView.setBusy(true);

      await Promise.resolve();

      try {
        const resp = await this.onfetchData(sInput);

        chatModel.setResult(resp);
        chatModel.setvisibleResult(true);
        console.log(resp);
      } catch (err) {
        console.error("Chat fetch error:", err);
        sap.m.MessageToast.show("Failed to get response.");
      } finally {
        oBusyDialog.close();
        oView.setBusy(false);
      }
    },

    onfetchData: async function (sInput) {
      const chatUrl = this.getBaseURL() + "/odata/v4/catalog/chatResponse";
      const csrfUrl = this.getBaseURL() + "/odata/v4/catalog/";
      const csrf = await this.onfetchCSRF(csrfUrl);

      // const url = "https://standard-chartered-bank-core-foundational-12982zqn-genai839893a.cfapps.ap11.hana.ondemand.com/api/chat";

      try {
        let response = await fetch(chatUrl, {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ prompt: sInput })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const sResponse = data.d.chatResponse.result;  // ✅ Store API response in a variable
        console.log("API Response:", sResponse);
        return sResponse;


        // Optional: Store result in SAPUI5 JSONModel
        // var oModel = new sap.ui.model.json.JSONModel({ apiResult: sResponse });
        // sap.ui.getCore().setModel(oModel, "chatModel");

      } catch (error) {
        console.error("API Error:", error);
      }

    },

    onGenerateSummary: async function (oEvent) {
      var aMultiBoxSelectedItems = this.byId("multiCombo").getSelectedItems();
      var textArea = this.byId("chatFeedInput");
      if (aMultiBoxSelectedItems.length > 1 || aMultiBoxSelectedItems.length == 0) {
        MessageBox.error("Please select a single file to Generate Summary.");
        return;
      }
      var oSelectedFile = aMultiBoxSelectedItems[0].getText(); // or .getKey() depending on your binding
      // MessageBox.success("Proceeding with file: ", oSelectedFile);
      textArea.setValue(`Research Summary: ${oSelectedFile}`)
      this._callSummaryApi("Research Summary: C-PressRelease-2Q25.pdf");
    },

    getBaseURL: function () {
      var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
      var appPath = appId.replaceAll(".", "/");
      var appModulePath = jQuery.sap.getModulePath(appPath);
      return appModulePath;
    },
    _callSummaryApi: async function (promptMessage) {
      const oBusy = new BusyDialog({ text: "Fetching summary..." });
      oBusy.open();
      // const oModel = this.getView().getmodel();
      // oModel.bindContext(`/chatResponse(...)`).execute();

      // const actionContext = oModel.bindContext(`/chatResponse(...)`, null, {
      //   $$updateGroupId: 'actionGroup',
      //   parameters: {
      //     prompt: promptMessage
      //   }
      // });

      // actionContext.execute().then((res)=>{
      //   if (!res.ok) throw new Error(res.statusText);
      //   return res.json();
      // })
      // .then(json => {
      //   if (json.success && Array.isArray(json.summary_files)) {
      //     var res = this._displayPdfFiles(json.summary_files);
      //     oBusy.close();
      //     return res;
      //   } else {
      //     MessageToast.show("No summaries returned.");
      //   }
      // })
      // .catch(err => {
      //   MessageToast.show("Error: " + err.message);
      // })
      // .finally(() => {
      //   oBusy.close();
      // });
      // var url = "https://standard-chartered-bank-core-foundational-12982zqn-genai839893a.cfapps.ap11.hana.ondemand.com/api/chat"          
      var url = this.getBaseURL() + "/user-api/currentUser";
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: promptMessage })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        if (json.success && Array.isArray(json.summary_files)) {
          var res = this._displayPdfFiles(json.summary_files);
          oBusy.close();
          return res;
        } else {
          MessageToast.show("No summaries returned.");
        }
        //   fetch(url, {
        //     method: "GET",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ message: promptMessage })
        // }).then(res => {
        //           if (!res.ok) throw new Error(res.statusText);
        //           return res.json();
        //         })
        //         .then(json => {
        //           if (json.success && Array.isArray(json.summary_files)) {
        //             var res = this._displayPdfFiles(json.summary_files);
        //             oBusy.close();
        //             return res;
        //           } else {
        //             MessageToast.show("No summaries returned.");
        //           }
        //         })
        //         .catch(err => {
        //           MessageToast.show("Error: " + err.message);
        //         })
        //         .finally(() => {
        //           oBusy.close();
        //         });
      } catch (err) {

      }
    },

    _displayPdfFiles: function (filesArray) {
      const oContainer = this.byId("pdfContainer");
      oContainer.removeAllItems();

      filesArray.forEach(file => {
        const oPdfViewer = this._createPdfViewer(file.data, file.filename);
        oContainer.addItem(oPdfViewer);
      });
    },

    _createPdfViewer: function (base64, filename) {
      const byteCharacters = atob(base64);
      const bytes = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        bytes[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      return new PDFViewer({
        source: url,
        title: filename,
        width: "100%",
        height: "600px",
        showDownloadButton: true
      });
    }
  });
});
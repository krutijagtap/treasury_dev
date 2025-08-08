sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageBox",
  "sap/m/PDFViewer",
  "sap/m/BusyDialog",
  "sap/m/MessageToast",
  "../lib/jspdf/jspdf.umd.min",
  "../lib/dompurify/purify.min",
  "../lib/html2canvas/html2canvas.min"
], (Controller, MessageBox, PDFViewer, BusyDialog, MessageToast) => {
  "use strict";

  return Controller.extend("treasuryui.controller.TreasuryMainView", {
    onInit() {
      let oModel = new sap.ui.model.json.JSONModel();
      // this.getView().setModel(oModel);
      this.getView().setModel(oModel, "treasuryModel");
    },
    onChatCopy: function () {
      const oChatBox = this.byId("ChatBotResult");
      const domRef = oChatBox?.getDomRef();

      if (!domRef) {
        sap.m.MessageToast.show("Nothing to copy");
        return;
      }

      const message = domRef.innerText;

      if (navigator?.clipboard && message) {
        navigator.clipboard
          .writeText(message)
          .then(() => {
            sap.m.MessageToast.show("Text copied to clipboard");
          })
          .catch((err) => {
            console.error("Copy failed", err);
            sap.m.MessageToast.show("Failed to copy text.");
          });
      }
    },
    onChatExport: async function () {
      if (!window.jspdf || !window.html2canvas) {
        sap.m.MessageToast.show("Required libraries not loaded.");
        return;
      }

      const { jsPDF } = window.jspdf;
      const userInput = this.getView().getModel("chatModel").getProperty("/userMessage") || "";

      const domRef = this.byId("ChatBotResult")?.getDomRef();
      if (!domRef) {
        sap.m.MessageToast.show("No content to export");
        return;
      }

      // --- Create hidden container ---
      const wrapper = document.createElement("div");
      wrapper.style.width = "794px"; // A4 width in px at 96 DPI
      wrapper.style.padding = "20px";
      wrapper.style.background = "#fff";
      wrapper.style.fontFamily = "Arial, sans-serif";
      wrapper.style.position = "absolute";
      wrapper.style.top = "0";
      wrapper.style.left = "-9999px";
      document.body.appendChild(wrapper);

      // --- User Input Section ---
      const userInputBox = document.createElement("div");
      userInputBox.style.background = "linear-gradient(to right, #e8f0ff, #f2f6fd)";
      userInputBox.style.padding = "16px 24px";
      userInputBox.style.borderRadius = "8px";
      userInputBox.style.marginBottom = "24px";
      userInputBox.style.border = "1px solid #cdddfb";

      const headerText = document.createElement("div");
      headerText.textContent = "USER INPUT";
      headerText.style.fontSize = "18px";
      headerText.style.fontWeight = "bold";
      headerText.style.color = "#1a73e8";
      headerText.style.marginBottom = "8px";

      const userInputText = document.createElement("div");
      userInputText.textContent = userInput;
      userInputText.style.fontSize = "14px";
      userInputText.style.color = "#333";

      userInputBox.appendChild(headerText);
      userInputBox.appendChild(userInputText);
      wrapper.appendChild(userInputBox);

      // --- Clone Chat Response ---
      const responseClone = domRef.cloneNode(true);
      responseClone.style.margin = "0"; // prevent extra spacing
      wrapper.appendChild(responseClone);

      // --- Wait for DOM to layout ---
      await new Promise(resolve => requestAnimationFrame(resolve));

      try {
        const canvas = await html2canvas(wrapper, {
          scale: 2,
          useCORS: true,
          scrollY: 0,
          windowWidth: wrapper.scrollWidth,
          height: wrapper.scrollHeight
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "pt", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position -= pdfHeight;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        pdf.save("Finsight_Chat_Export.pdf");
        sap.m.MessageToast.show("PDF exported successfully");

      } catch (err) {
        console.error("PDF export failed", err);
        sap.m.MessageToast.show("Failed to export PDF");
      } finally {
        document.body.removeChild(wrapper);
      }
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
      var aSelectedItems = this.byId("multiCombo").getSelectedItems();
      const isIntellibase = sInput.toLowerCase().includes("intellibase");
      const keywords = ["SELECT","INSERT", "UPDATE", "DELETE", "DROP", "UNION", "CREATE", "TRUNCATE"];
      const isValid = isIntellibase || aSelectedItems.length > 0;
      const isMalicious = keywords.some(keyword => sInput.toUpperCase().includes(keyword));
      // Disable submit + hide previous result
      chatModel.setSubmit(false);
      chatModel.setvisibleResult(false);
      if (!sInput || sInput.length < 3) {
        MessageBox.information("Minimum 3 characters required to proceed");
        return;
      }
      if(isMalicious){
        MessageBox.error("The prompt contains a malicious word, please remove it and proceed");
        return;
      }
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
        const resp = await this.onfetchData(sInput, isValid, isIntellibase);

        chatModel.setResult(resp);
        chatModel.setvisibleResult(true);
        console.log(resp);
        return resp;
      } catch (err) {
        console.error("Chat fetch error:", err);
        sap.m.MessageToast.show("Failed to get response.");
      } finally {
        oBusyDialog.close();
        oView.setBusy(false);
      }
    },

    onfetchData: async function (sInput, isValid, isIntellibase) {
      const chatUrl = this.getBaseUrl() + "/api/chat";
      const thisUser = this.getBaseUrl() + "/user-api/currentUser";
      var payload;
      const csrf = this.fetchCsrfToken();
      const oContainer = this.byId("pdfContainer");
      oContainer.removeAllItems();
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort(); // Aborts the request after 90s
      }, 90000);

      //get user details to fetch bankID
      const user = await fetch(thisUser, {
        method: "GET",
        headers: {
          "X-CSRF-Token": csrf,
          "Content-Type": "application/json"
        }
      })
      if (!user.ok) {
        MessageBox.error("Not a valid user");
        return;
      }
      const userDetails = await user.json();
      const bankId = userDetails.name;

      if (!isValid) {
        MessageBox.error("Please select a file or Ask Intellibase");
        return;
      }
      if (isIntellibase) { payload = { "message": "user_id:" + bankId + ":" + sInput }; }
      else {
        payload = { "message": sInput };
      }

      try {
        const response = await fetch(chatUrl, {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        var sResponse;
        if (isIntellibase) {
          sResponse = data.FINAL_RESULT + "<h3>SQL Query Used:</h3>" +
            "<pre style='font-family: monospace; white-space: pre-wrap;'>" +
            data.SQL_QUERY + "</pre>";
        }
        else {
          sResponse = data.FINAL_RESULT;
        }
        const oHtml = new sap.m.FormattedText({
          htmlText: sResponse
        });
        oContainer.addItem(oHtml);
        // oContainer.addItem(sResponseQuery);
        console.log("API Response:", sResponse);
        return oContainer;
      } catch (err) {
        console.log("inside catch of askFinsight", err);
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
      this._callSummaryApi("Research Summary: C-PressRelease-2Q25.pdf", oSelectedFile);
    },
    getBaseUrl: function () {
      return sap.ui.require.toUrl('treasuryui');
    },
    fetchCsrfToken: async function () {
      let url = this.getBaseUrl();
      const response = await fetch(url, {
        method: "HEAD",
        credentials: "include",
        headers: {
          "X-CSRF-Token": "Fetch"
        }
      })
      const token = response.headers.get("X-CSRF-Token");
      return token;
    },
    _callSummaryApi: async function (promptMessage, oSelectedFile) {
      const oBusy = new BusyDialog({ text: "Fetching summary..." });
      oBusy.open();
      // var url = "https://standard-chartered-bank-core-foundational-12982zqn-genai839893a.cfapps.ap11.hana.ondemand.com/api/chat"  
      const chatModel = this.getOwnerComponent().getModel("chatModel");
      const chatUrl = this.getBaseUrl() + "/api/chat";
      const csrf = this.fetchCsrfToken();
      const payload = {
        "message": "Research Summary: " + oSelectedFile
      };
      // // Disable submit + hide previous result
      chatModel.setSubmit(false);
      chatModel.setvisibleResult(false);
      // var url = sap.ui.require.toUrl('treasuryui') + "/user-api/currentUser";
      try {
        const response = await fetch(chatUrl, {
          method: "POST",
          headers: {
            "X-CSRF-Token": csrf,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const json = await response.json();
        if (json.success && Array.isArray(json.summary_files)) {
          var res = this._displayPdfFiles(json.summary_files);
          oBusy.close();
          chatModel.setResult(res);
          chatModel.setvisibleResult(true);
          return res;
        } else {
          MessageToast.show("No summaries returned.");
        }
      } catch (err) {
        console.log("inside catch of generate summary", err);
      }
    },

    _displayPdfFiles: function (filesArray) {
      const oContainer = this.byId("pdfContainer");
      oContainer.removeAllItems();

      filesArray.forEach(file => {
        const oPdfViewer = this._createPdfViewer(file.data, file.filename);
        oContainer.addItem(oPdfViewer);
      });
      return oContainer;
    },

    _createPdfViewer: function (base64, filename) {
      const byteCharacters = atob(base64);
      const bytes = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        bytes[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const downloadButton = new sap.m.Button({
        icon: "sap-icon://download",
        tooltip: "Download PDF",
        type: "Transparent",
        press: function () {
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.click();
        }
      });

      return new sap.m.Panel({
        headerText: filename,
        width: "100%",
        height: "250vh",
        content: [
          downloadButton,
          new sap.ui.core.HTML({
            content: `<iframe src="${url}" class="pdf-iframe" style="width: 100%; height: 150vh;"></iframe>`
          })
        ],
        layoutData: new sap.m.FlexItemData({ growFactor: 1 })
      });
      // return new sap.m.PDFViewer({
      //   source: url,
      //   title: filename,
      //   width: "100%",
      //   height: "600px",
      //   showDownloadButton: true
      // });
    }
  });
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel"
], (Controller, JSONModel) => {
    "use strict";

    return Controller.extend("treasuryui.controller.ReportsView", {
        onInit() {
            const oModel = new JSONModel({
                files: [],
                classifedCheck: false
            });
            this.getView().setModel(oModel);
        },
        onFilesSelected: function (oEvent) {
            const oModel = this.getView().getModel();
            var aFiles = oEvent.getParameter("files");
            const aAllFiles = [];

            for(let i =0; i<aFiles.length; i++){
                aAllFiles.push({
                    name: aFiles[i].name,
                    radioIndex: -1 //not selected yet
                })
            }
            oModel.setProperty("/files",aAllFiles);
            this._updateButtonState();
            //check for duplicate files getting uploaded, and fix overwriting when selecting files one by one
        },
        onRadioSelected: function (){
            this._updateButtonState();
        },
        _updateButtonState: function(){
            const oModel = this.getView().getModel();
            const aFiles = oModel.getProperty("/files");
            const isClassified = aFiles.length > 0 && aFiles.every(file => file.radioIndex !== -1);
            oModel.setProperty("/classifiedcheck",isClassified);
        },
        onAttachmentDelete: function(oEvent){
            var oContext = oEvent.getSource();
        }
    });
});
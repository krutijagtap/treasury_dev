sap.ui.define([
    "sap/ui/core/UIComponent",
    "treasuryui/model/models",
    "treasuryui/model/chatModel"
], (UIComponent, models, chatModel) => {
    "use strict";

    return UIComponent.extend("treasuryui.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();

            //set chat model
            this.setModel(new chatModel(), "chatModel");

            this.getModel().refresh();
        }
    });
});
sap.ui.define([
    "sap/ui/core/UIComponent",
<<<<<<< HEAD
    "treasuryui/model/models",
    "treasuryui/model/chatModel"
], (UIComponent, models, chatModel) => {
=======
    "treasuryui/model/models"
], (UIComponent, models) => {
>>>>>>> 6b05fe794e00b05f88f2dcdcb1b496cae8816a1f
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
<<<<<<< HEAD

            //set chat model
            this.setModel(new chatModel(), "chatModel");
=======
>>>>>>> 6b05fe794e00b05f88f2dcdcb1b496cae8816a1f
        }
    });
});
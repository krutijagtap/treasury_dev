<<<<<<< HEAD
sap.ui.define(["sap/ui/core/UIComponent","treasuryui/model/models","treasuryui/model/chatModel"],(e,t,i)=>{"use strict";return e.extend("treasuryui.Component",{metadata:{manifest:"json",interfaces:["sap.ui.core.IAsyncContentCreation"]},init(){e.prototype.init.apply(this,arguments);this.setModel(t.createDeviceModel(),"device");this.getRouter().initialize();this.setModel(new i,"chatModel")}})});
=======
sap.ui.define(["sap/ui/core/UIComponent","treasuryui/model/models"],(e,t)=>{"use strict";return e.extend("treasuryui.Component",{metadata:{manifest:"json",interfaces:["sap.ui.core.IAsyncContentCreation"]},init(){e.prototype.init.apply(this,arguments);this.setModel(t.createDeviceModel(),"device");this.getRouter().initialize()}})});
>>>>>>> 6b05fe794e00b05f88f2dcdcb1b496cae8816a1f
//# sourceMappingURL=Component.js.map
sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (MessageToast, MessageBox, BusyIndicator) {
    'use strict';

    return {
        onInit: async function () {
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
                    isAdmin: hasScopeForChecker,   
                    isViewer: hasScopeForMaker 
                });

                this.getView().setModel(authModel, "authModel");  // set the model with a named model

                console.log("Auth model created:", authModel.getData());

            } catch (error) {
                console.error("API Error:", error);
            }
        },
        onPress: function (oEvent) {
            MessageToast.show("Custom handler invoked.");

            const ctx = oEvent.getSource().getBindingContext();
            const fileID = ctx.getProperty("ID");

            //  Confirmation before delete
            MessageBox.confirm("Perform this action?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: async (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        BusyIndicator.show(0);
                        const baseUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion');
                        const thisUser = baseUrl + "/user-api/currentUser";
                        const contentUrl = baseUrl + "/odata/v4/catalog/Content/" + fileID;
                        const approveUrl = baseUrl + "/odata/v4/catalog/Content/" + fileID + "/approveContent";
                        const controller = new AbortController();
                        const timeout = setTimeout(() => {
                            controller.abort(); // Aborts the request after 90s
                        }, 90000);

                        try {
                            // generate csrf token
                            const response = await fetch(baseUrl, {
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

                            //get user details to fetch bankID
                            const user = await fetch(thisUser, {
                                method: "GET",
                                headers: {
                                    "X-CSRF-Token": token,
                                    "Content-Type": "application/json"
                                }
                            })
                            if (!user.ok) {
                                MessageBox.error("Not a valid user");
                                return;
                            }
                            const userDetails = await user.json();
                            const bankId = userDetails.name;

                            // fetch content to validate ID
                            const resContent = await fetch(contentUrl, {
                                method: "GET",
                                headers: {
                                    "Content-Type": "application/json",
                                    "X-CSRF-Token": token
                                },
                                credentials: "include",
                            });
                            const res = await resContent.json();

                            if (!(res.createdBy == bankId)) {
                                const aprvContent = await fetch(approveUrl, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "X-CSRF-Token": token
                                    },
                                    credentials: "include",
                                });
                                clearTimeout(timeout);

                                const result = await aprvContent.json();
                                if (aprvContent.ok) {
                                    MessageBox.information("File approved and available for QnA and Summarization");
                                    this.editFlow.getView().getId("approveID").setVisible(false);
                                    this.getEditFlow().getView().getController().getExtensionAPI().refresh();
                                } else {
                                    MessageBox.error(result.error.message);
                                }
                            }
                            else {
                                MessageBox.information("You cannot approve your own files");
                                return;
                            }
                        } catch (err) {
                            MessageBox.error(err.message || err);
                        } finally {
                            BusyIndicator.hide();
                        }
                    }
                }
            });
        }
    };
});

sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator"
], function (MessageToast, MessageBox, BusyIndicator) {
    'use strict';

    return {
        onPress: function (oEvent) {
            const ctx = oEvent.getSource().getBindingContext();
            const fileID = ctx.getProperty("ID");

            //  Confirmation before delete
            MessageBox.confirm("Do you want to delete this file?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: async (sAction) => {
                    if (sAction === MessageBox.Action.OK) {
                        BusyIndicator.show(0);
                        const baseUrl = sap.ui.require.toUrl('com/scb/treasury/contentingestion');
                        const thisUser = baseUrl + "/user-api/currentUser";
                        const contentUrl = baseUrl + "/odata/v4/catalog/Content/" + fileID;
                        const deleteUrl = baseUrl + "/odata/v4/catalog/Content/" + fileID + "/deleteContent";

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

                            if (res.createdBy == bankId) {
                                const delContent = await fetch(deleteUrl, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "X-CSRF-Token": token
                                    },
                                    credentials: "include",
                                });

                                const result = await delContent.json();
                                if (delContent.ok) {
                                    MessageBox.information("File has been successfully deleted");
                                    this.getEditFlow().getView().getController().getExtensionAPI().refresh();
                                } else {
                                    MessageBox.error(result.error.message);
                                }
                            }
                            else {
                                MessageBox.information("You cannot delete files that are not created by you");
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

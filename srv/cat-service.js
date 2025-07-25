const cds = require("@sap/cds");
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');

module.exports = cds.service.impl(async function () {
  const { Content, SummaryFiles, ActionVisibility } = this.entities;

  this.after("READ", "Content", (each, req) => {
    each.isChecker = req.user?.roles?.ContentChecker === 1;
  });

  //-------------------------------------------------------------
  //    Authorization check based on user logged in
  //-------------------------------------------------------------
  this.on("READ", ActionVisibility, async (req) => {
    return {
      isChkr: req.user?.roles?.ContentChecker === 1,
      isMaker: req.user?.roles?.ContentMaker === 1
    };
  });
  

  this.on("createContent", async (req) => {
    const payloadArray = JSON.parse(req.data.initialData); // Array of objects

    // Validate it's an array
    if (!Array.isArray(payloadArray)) {
      return req.error(400, "initialData must be an array");
    }

    // Insert entries one by one
    for (const data of payloadArray) {
      await INSERT.into(Content).entries({
        ID: data.keyID,
        fileName: data.fileName,
        mediaType: data.mediaType,
        tagType_code: data.tagType,
        status_code: data.status,
        url: data.url,
        createdBy: cds.context.user.id,
        // content: data.content, // Add if needed later
      });
    }

    // Insert entries one by one
    for (const data of payloadArray) {
      if (data.tagType == "SUMMARY") {

        await INSERT.into(SummaryFiles).entries({
          fileName: "Test ABC",
          fileContent: "",
          url: "https://sapui5.hana.ondemand.com/#/entity/sap.m.CustomListItem/sample/sap.m.sample.CustomListItem/code",
          createdBy: cds.context.user.id,
          content_ID:data.keyID
        });
        await INSERT.into(SummaryFiles).entries({
          fileName: "Test ABC 4",
          fileContent: "",
          url: "https://sapui5.hana.ondemand.com/#/entity/sap.m.CustomListItem/sample/sap.m.sample.CustomListItem/code",
          createdBy: cds.context.user.id,
          content_ID:data.keyID
        });
        await INSERT.into(SummaryFiles).entries({
          fileName: "Test ABC 3",
          fileContent: "",
          url: "https://sapui5.hana.ondemand.com/#/entity/sap.m.CustomListItem/sample/sap.m.sample.CustomListItem/code",
          createdBy: cds.context.user.id,
          content_ID:data.keyID
        });
        //Call the API responsible for creating the summary files
        // let SummaryResponse;
        // //Then insert into SummaryFiles
        // //Assume array as response from previous call
        // for (const summary of SummaryResponse) {
        //   await INSERT.into(SummaryFiles).entries({
        //     fileName: summary.fileName,
        //     fileContent: summary.fileContent,
        //     url: summary.url,
        //     createdBy: cds.context.user.id,
        //   });
        // }
      }
    }

    return {
      success: true,
      message: `${payloadArray.length} records inserted.`,
    };
  });
  this.on("approveContent", async (req) => {
    const ID = req.params[0].ID;
    //Call API to create Embeddings
    const embeddingService = await cds.connect.to("TestSbcDest");
    const tx = embeddingService.tx(req);

    try {
      const embeddings = await tx.send({
        method: "POST",
        path: "/api/generate-embeddings",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.log("Failed in getting embeddings due to: " + error);
    }

    await UPDATE(Content, ID).with({
      status_code: "APPROVED",
    });
  });

  this.on("rejectContent", async (req) => {
    const ID = req.params[0].ID;
    await UPDATE(Content, ID).with({
      status_code: "REJECTED",
    });
  });

  this.on("submit", async (req) => {
    const { ID } = req.params[0]; // since bound to entity
    await UPDATE(Content).set({ status_code: "SUBMITTED" }).where({ ID });
    const updated = await SELECT.one.from(Content).where({ ID });
    return updated;
  });
});


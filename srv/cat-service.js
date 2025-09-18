const cds = require("@sap/cds");
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const { response } = require("express");
const sapCfAxios = require("sap-cf-axios").default;
const axios = require("axios");
const FormData = require("form-data");
const { Readable } = require('stream');
const fetch = require("node-fetch");
const { isOriginOptions } = require("@sap-cloud-sdk/http-client/dist/http-client-types");

module.exports = cds.service.impl(async function () {
  const { Content, SummaryFiles, ActionVisibility } = this.entities;

  this.after("READ", "Content", (each, req) => {
    each.canApprove = req.user.is('ContentChecker');
    each.canDelete = req.user.is('ContentMaker');
    each.isChecker = req.user?.roles?.ContentChecker === 1;

  });

  // this.on("READ", "Content", async (req, next) => {
  //   const result = await next();

  //   // Ensure mediaType is fetched even if frontend didn’t request
  //   const ids = result.map(r => r.ID);
  //   if (ids.length) {
  //     const mediaTypes = await SELECT.from(Content)
  //       .columns("ID", "mediaType")
  //       .where({ ID: { in: ids } });

  //     const lookup = Object.fromEntries(mediaTypes.map(r => [r.ID, r.mediaType]));

  //     result.forEach(r => {
  //       const mt = lookup[r.ID];
  //       if (mt) {
  //         if (mt.includes("pdf")) r.fileType = "PDF";
  //         else if (mt.includes("sheet") || mt.includes("excel")) r.fileType = "Excel";
  //         else if (mt.includes("word")) r.fileType = "Document/Word";
  //         else r.fileType = "Other";
  //       }
  //     });
  //   }
  //   return result;
  // });


  //-------------------------------------------------------------
  //    Authorization check based on user logged in
  //-------------------------------------------------------------
  this.on("READ", ActionVisibility, async (req) => {
    return {
      isChkr: req.user?.roles?.ContentChecker === 1,
      isMaker: req.user?.roles?.ContentMaker === 1
    };
  });


  // this.on("createContent", async (req) => {
  //   const payloadArray = JSON.parse(req.data.initialData); // Array of objects

  //   // Validate it's an array
  //   if (!Array.isArray(payloadArray)) {
  //     return req.error(400, "initialData must be an array");
  //   }

  //   // Insert entries one by one
  //   for (const data of payloadArray) {
  //     await INSERT.into(Content).entries({
  //       ID: data.keyID,
  //       fileName: data.fileName,
  //       mediaType: data.mediaType,
  //       tagType_code: data.tagType,
  //       status_code: data.status,
  //       url: data.url,
  //       createdBy: cds.context.user.id,
  //       // content: data.content, // Add if needed later
  //     });
  //   }

  //   // Insert entries one by one
  //   for (const data of payloadArray) {
  //     if (data.tagType == "SUMMARY") {

  //       await INSERT.into(SummaryFiles).entries({
  //         fileName: "Test ABC",
  //         fileContent: "",
  //         url: "https://sapui5.hana.ondemand.com/#/entity/sap.m.CustomListItem/sample/sap.m.sample.CustomListItem/code",
  //         createdBy: cds.context.user.id,
  //         content_ID: data.keyID
  //       });
  //       await INSERT.into(SummaryFiles).entries({
  //         fileName: "Test AB",
  //         fileContent: "",
  //         url: "https://sapui5.hana.ondemand.com/#/entity/sap.m.CustomListItem/sample/sap.m.sample.CustomListItem/code",
  //         createdBy: cds.context.user.id,
  //         content_ID: data.keyID
  //       });
  //       await INSERT.into(SummaryFiles).entries({
  //         fileName: "Test AC",
  //         fileContent: "",
  //         url: "https://sapui5.hana.ondemand.com/#/entity/sap.m.CustomListItem/sample/sap.m.sample.CustomListItem/code",
  //         createdBy: cds.context.user.id,
  //         content_ID: data.keyID
  //       });
  //       //Call the API responsible for creating the summary files
  //       // let SummaryResponse;
  //       // //Then insert into SummaryFiles
  //       // //Assume array as response from previous call
  //       // for (const summary of SummaryResponse) {
  //       //   await INSERT.into(SummaryFiles).entries({
  //       //     fileName: summary.fileName,
  //       //     fileContent: summary.fileContent,
  //       //     url: summary.url,
  //       //     createdBy: cds.context.user.id,
  //       //   });
  //       // }
  //     }
  //   }

  //   return {
  //     success: true,
  //     message: `${payloadArray.length} records inserted.`,
  //   };
  // });
  function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  // helper to enforce timeout
  function withTimeout(promise, ms, msg = "Request timed out") {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(msg)), ms);
      promise
        .then((res) => {
          clearTimeout(timer);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  this.on("approveContent", async (req) => {
    const ID = req.params[0].ID;
    const destination = await getDestination({ destinationName: "Treasurybackend" });

    const oneFile = await SELECT.one
      .from(Content)
      .columns("fileName", "mediaType", "content", "createdBy")
      .where({ ID });

    // role check
    if (oneFile.createdBy === req.user.id) {
      return req.reject(400, "You cannot approve files that are created by you");
    }

    if (!oneFile?.content) {
      return req.reject(404, "File content not found.");
    }

    const buffer = await streamToBuffer(oneFile.content);
    const formData = new FormData();
    formData.append("file", buffer, {
      filename: oneFile.fileName,
      contentType: oneFile.mediaType,
    });

    try {
      // wrapping logic in timeout 90sec
      return await withTimeout(
        (async () => {
          //check for approved-file-upload
          const responseFileUpload = await axios.post(`${destination.url}/api/approved-file-upload`, formData, {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${destination.authTokens?.[0]?.value}`,
            }
          });
          console.log("upload response:", responseFileUpload)

          if (responseFileUpload.status == 200) {
            if (responseFileUpload.data.success) {
              const responseEmbeddings = await axios.post(
                `${destination.url}/api/generate-embeddings`,
                { filename: oneFile.fileName },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${destination.authTokens?.[0]?.value}`
                  }
                }
              );
              console.log("Embeddings Response:", responseEmbeddings)
              if (responseEmbeddings.data.success) {
                await UPDATE(Content, ID).with({
                  status: "COMPLETED"
                });
                console.log("Embeddings generated successfully")
                req.info("File approved and available for QnA and Summarization");
                return await SELECT.one.from(Content).where({ ID });
                // return ("Embeddings generated successfully");
              }
              else
                throw new Error(`Embedding API failed with status ${responseFileUpload.status}`)
            }
          } else {
            throw new Error(`Embedding API failed with status ${responseFileUpload.status}`)
          }
        })(),
        90000, // 90 seconds
        "Approve action timed out after 90 seconds"
      );
    } catch (error) {
      console.error("Failed in approveContent:", error);
      throw error;
    } finally {
      // cleanup
      try {
        const responseDelDoc = await axios.post(
          `${destination.url}/api/delete-document`,
          { filename: oneFile.fileName },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${destination.authTokens?.[0]?.value}`,
            },
          }
        );
        console.log("Delete Document API Response:", responseDelDoc.data);
      } catch (err) {
        console.log("Delete API failed in finally block:", err);
      }
    }
  });


  this.on("rejectContent", async (req) => {
    const ID = req.params[0].ID;
    const oneFile = await SELECT.one
      .from(Content)
      .columns('fileName', 'mediaType', 'content', 'createdBy')
      .where({ ID });
    //check user role - checker can approve any file
    // if user is maker - he can't approve his own file
    const ownFile = oneFile.createdBy === req.user.id;

    if (ownFile) {
      req.reject(400, 'You cannot Reject files that are created by you');
    }
    await UPDATE(Content, ID).with({
      status: "REJECTED",
    });
    req.info("The file " + oneFile.fileName + " has been REJECTED");
    return await SELECT.one.from(Content).where({ ID });
  });



  this.on("deleteContent", async (req) => {
    const { ID } = req.params[0];
    try {
      const file = await cds.run(
        SELECT.one.from(Content).where({ ID: ID })
      );
      //check the role - if maker -> createdby and logged in user should be Same
      //if checker can delete any file
      const ownFiles = file.createdBy === req.user.id; // only owner can delete its own file
      const fileName = file.fileName;

      if (!ownFiles) {
        req.reject(400, 'You cannot delete files that are not created by you');
      }

      const response = await executeHttpRequest(
        { destinationName: 'Treasurybackend' },
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          url: '/api/delete-files',
          data: { "filename": fileName }
        }
      );
      if (!response.data.success) {
        req.reject(response.data.message);
      }
      await DELETE.from(Content).where({ ID: ID });
      // const table = await SELECT.from(Content);
      req.info(response.data.message);
      return { ID };
    } catch (error) {
      console.log("Error in delete files API: " + error);
    }
  });



  this.on("submit", async (req) => {
    const { ID } = req.params[0]; // since bound to entity
    await UPDATE(Content).set({ status: "SUBMITTED" }).where({ ID });
    const updated = await SELECT.one.from(Content).where({ ID });
    return updated;
  });



  this.on('chatResponse', async (req) => {
    console.log("request obj" + req);
    const response = await executeHttpRequest(
      { destinationName: 'Treasurybackend' },
      {
        method: 'POST',
        url: '/api/chat',
        headers: {
          "Content-Type": "application/json"
        },
        data: { "message": req.data.prompt }
      }
    );
    if (response.status === 200 && response.data != null) {
      return response.data
    } else {
      throw new Error(`Error creating chat response ${response.status}`)
    }
  });

  this.on("showMetaData", async (req) => {
    console.log("metaData");
    return "";
  });

});

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

  this.on("approveContent", async (req) => {
    const ID = req.params[0].ID;
    const destination = await getDestination({ destinationName: 'Treasurybackend' });
    const oneFile = await SELECT.one
      .from(Content)
      .columns('fileName', 'mediaType', 'content','createdBy')
      .where({ ID });
    //check user role - checker can approve any file
    // if user is maker - he can't approve his own file
    const ownFile = oneFile.createdBy === req.user.id;
    if(ownFile.length){
      req.reject(400, 'You cannot approve files that are created by you');
    }
    //check if file content exists
    if (!oneFile?.content) {
      return req.reject(404, 'File content not found.');
    }

    const buffer = await streamToBuffer(oneFile.content);
    // Create a buffer for form-data
    const formData = new FormData();
    formData.append("file", buffer, {
      filename: oneFile.fileName,
      contentType: oneFile.mediaType
    });
    console.log("form Data", formData)

    //Call API to create Embeddings
    try {
      //check for approved-file-upload
      const responseFileUpload = await axios.post(`${destination.url}/api/approved-file-upload`, formData, {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${destination.authTokens?.[0]?.value}`
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
            return await SELECT.one.from(Content).where({ ID });
            // return ("Embeddings generated successfully");
          }
          else
            throw new Error(`Embedding API failed with status ${responseFileUpload.status}`)
        }
      } else {
        throw new Error(`Embedding API failed with status ${responseFileUpload.status}`)
      }
    } catch (error) {
      console.log("Failed in getting embeddings due to: " + error);
    }
  });



  this.on("rejectContent", async (req) => {
    const ID = req.params[0].ID;
    await UPDATE(Content, ID).with({
      status: "REJECTED",
    });
    return await SELECT.one.from(Content).where({ ID });
  });



  this.on("deleteContent", async (req) => {
    const ID = req.params[0].ID;
    try {
      const file = await cds.run(
        SELECT.one.from(Content).where({ ID: ID })
      );
      //check the role - if maker -> createdby and logged in user should be Same
      //if checker can delete any file
      const ownFiles = file.createdBy === req.user.id; // only owner can delete its own file
      const fileName = file.fileName;
      if(req.user.roles.ContentMaker === 1){
      if (!ownFiles) {
        req.reject(400, 'You cannot delete files that are not created by you');
      }
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
      if (response.data.success) {
        await DELETE.from(Content).where({ ID: ID });
      }
      return { message: 'File deleted successfully' };
    } catch (error) {
      console.log("Failed in getting embeddings due to: " + error);
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

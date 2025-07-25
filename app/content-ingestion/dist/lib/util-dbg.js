sap.ui.define([],
    function () {
      "use strict";
  
      /**
       * Returns i18n text for the key
       *
       * @param {string} key for which i18n text is required
       * @param {object} extensionApi Fiori Element V4 extension API
       * @returns {string} text for the key
       */
      function getI18nText(key, extensionApi) {
        return extensionApi?.getModel("i18n")?.getResourceBundle()?.getText(key);
      }

        /**
    * Executes unbounded custom actions with EditFlow invokeAction - applies busy
    * @param {object} extensionApi Fiori Element V4 extension API
    * @param {object} model of the onboarding
    * @param {string} action - action service path
    * @param {object} parameters - Payload params
    * @returns {Promise} for the action context
    */
  async function executeUnBoundInvokeAction(extensionApi, model, action, parameters = {}) {
    const parameterValues = [];
    Object.entries(parameters)
      .forEach(([param, value]) => {
        parameterValues.push({
          name: param,
          value: value
        });
      });
    return new Promise(function (resolve, reject) {
      extensionApi.editFlow.invokeAction(action,
        {
          model: model,
          parameterValues: parameterValues,
          skipParameterDialog: true,
          invocationGrouping: true
        }
      ).then(function (oContext) {
        const responseData = oContext;
        if (responseData?.status == "FAILED") {
          reject(responseData);
        } else {
          resolve(responseData);
        }
      }).catch(error => {
        reject(error);
      });
    });
  }
  
      return {
        getI18nText,
        executeUnBoundInvokeAction
      };
    }
  );
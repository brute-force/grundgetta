const Alexa = require('ask-sdk-core');
const { getData, isInCorrectTimezone, isHolidaySchedule } = require('./util/api-requests');
const { getNextRefuseDay } = require('./util/collectionSchedule');
const { messages, PERMISSIONS, TIME_ZONE } = require('./util/constants');
const AddressNotFoundError = require('./util/AddressNotFoundError');

/**
 * Custom Intent Handler for retrieving garbage and recycling collection days
 */
const RefuseIntentHandler = {
  canHandle (handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'RefuseIntent';
  },
  async handle (handlerInput) {
    const { requestEnvelope, serviceClientFactory, responseBuilder, attributesManager } = handlerInput;

    const consentToken = requestEnvelope.context.System.user.permissions &&
      requestEnvelope.context.System.user.permissions.consentToken;

    if (!consentToken) {
      return responseBuilder
        .speak(messages.NOTIFY_MISSING_PERMISSIONS)
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    }

    try {
      const { deviceId } = requestEnvelope.context.System.device;
      const { apiAccessToken } = requestEnvelope.context.System;
      const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
      const address = await deviceAddressServiceClient.getFullAddress(deviceId);

      let reply;

      // disallow devices in time zones outside New York City
      if ((await isInCorrectTimezone(apiAccessToken, deviceId, TIME_ZONE)) === false) {
        reply = responseBuilder.speak(messages.TIME_ZONE_INVALID).getResponse();
      // require number and street address and zip code
      } else if (address.addressLine1 === null || address.postalCode === null) {
        reply = responseBuilder.speak(messages.ADDRESS_MISSING).getResponse();
      } else {
        // use RefuseType slot value for reply and standardize slot value synonyms
        const refuseSlot = requestEnvelope.request.intent.slots.RefuseType;
        const refuseType = refuseSlot.value.trim().toLowerCase()
          .replace('trash', 'garbage')
          .replace('recycle', 'recycling');

        // retrieve refuse collection data and get the earliest refuse day
        const data = await getData(address.addressLine1 + ' ' + address.postalCode);
        const refuseDays = data[refuseType];

        if (refuseDays.length === 0) {
          return responseBuilder.speak(messages.SCHEDULE_UNKNOWN.replace('RefuseType', refuseType)).getResponse();
        }

        const nextRefuseDay = getNextRefuseDay(refuseDays);

        let output;

        // collection day is today
        if (nextRefuseDay.daysUntil === 0) {
          // holiday schedule today
          if (await isHolidaySchedule()) {
            output = messages.SCHEDULE_HOLIDAY;
          } else {
            // add collection times if collection day is today
            output = `${messages.SCHEDULE_NORMAL} today. ${messages.PICKUP_TODAY} ${data.residentialRoutingTime}.`;
          }
        // collection day is tomorrow
        } else if (nextRefuseDay.daysUntil === 1) {
          output = `${messages.SCHEDULE_NORMAL} tomorrow. ${messages.PICKUP_TOMORROW}`;
        // collection day is in a few days
        } else {
          output = `${messages.SCHEDULE_NORMAL} in ${nextRefuseDay.daysUntil} days, on ${nextRefuseDay.day}.`;
        }

        output = output.replace(/RefuseType/g, refuseType).replace(/Daily: /, '');

        // store the output
        const sessionAttributes = attributesManager.getSessionAttributes();
        sessionAttributes.outputLast = output;
        attributesManager.setSessionAttributes(sessionAttributes);

        reply = responseBuilder.speak(output).getResponse();
      }

      return reply;
    } catch (err) {
      // console.log(`error: ${JSON.stringify(err)}`);

      if (err instanceof AddressNotFoundError) {
        return responseBuilder.speak(messages.ADDRESS_NOT_FOUND).getResponse();
      } else if (err.name !== 'ServiceError') {
        return responseBuilder.speak(messages.ERROR).getResponse();
      }

      throw err;
    }
  }
};

/**
 * Repeat Handler
 */
const RepeatRequestHandler = {
  canHandle (handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle (handlerInput) {
    const { responseBuilder, attributesManager } = handlerInput;

    const sessionAttributes = attributesManager.getSessionAttributes();
    const output =
      sessionAttributes.outputLast ? `${messages.REPEAT} ${sessionAttributes.outputLast}` : messages.WELCOME;

    return responseBuilder
      .speak(output)
      .reprompt(messages.WELCOME)
      .getResponse();
  }
};

/**
 * Launch Handler
 */
const LaunchRequestHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle (handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.WELCOME)
      .reprompt(messages.WHAT_DO_YOU_WANT)
      .getResponse();
  }
};

/**
 * Session Ended Handler
 */
const SessionEndedRequestHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle (handlerInput) {
    // console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  }
};

/**
 * Unhandled Intent Handler
 */
const UnhandledIntentHandler = {
  canHandle () {
    return true;
  },
  handle (handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.UNHANDLED)
      .reprompt(messages.UNHANDLED)
      .getResponse();
  }
};

/**
 * Help Intent Handler
 */
const HelpIntentHandler = {
  canHandle (handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle (handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.HELP)
      .reprompt(messages.HELP)
      .getResponse();
  }
};

/**
 * Cancel Intent Handler
 */
const CancelIntentHandler = {
  canHandle (handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent';
  },
  handle (handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.GOODBYE)
      .getResponse();
  }
};

/**
 * Stop Intent Handler
 */
const StopIntentHandler = {
  canHandle (handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
  },
  handle (handlerInput) {
    return handlerInput.responseBuilder
      .speak(messages.STOP)
      .getResponse();
  }
};

/**
 * Error Handler for address and permissions errors
 */
const GetAddressErrorHandler = {
  canHandle (handlerInput, error) {
    return error.name === 'ServiceError';
  },
  handle (handlerInput, error) {
    if (error.statusCode === 403) {
      return handlerInput.responseBuilder
        .speak(messages.NOTIFY_MISSING_PERMISSIONS)
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(messages.LOCATION_FAILURE)
      .reprompt(messages.LOCATION_FAILURE)
      .getResponse();
  }
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RefuseIntentHandler,
    RepeatRequestHandler,
    SessionEndedRequestHandler,
    HelpIntentHandler,
    CancelIntentHandler,
    StopIntentHandler,
    UnhandledIntentHandler
  )
  .addErrorHandlers(GetAddressErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();

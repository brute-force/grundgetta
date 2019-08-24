const Alexa = require('ask-sdk');
const moment = require('moment-timezone');
const { getData, isInCorrectTimezone, isHolidaySchedule } = require('./api-requests');

const messages = {
  WELCOME: 'Ask me \'when is the next garbage day?\' or \'when is the next recycling day?\'',
  WHAT_DO_YOU_WANT: 'What do you want to ask?',
  NOTIFY_MISSING_PERMISSIONS: 'Please enable Location permissions in the Amazon Alexa app.',
  NO_ADDRESS: 'Set your address including street number, street, and zip code in the Amazon Alexa app.',
  WRONG_ADDRESS: 'You don\'t have an address in New York City. Consider moving.',
  HOLIDAY_SCHEDULE: 'Sanitation is on holiday schedule. Set your RefuseType out after 4 pm today for pickup tomorrow.',
  PICKUP_TOMORROW: 'Set your RefuseType out after 4 PM today.',
  PICKUP_TODAY: 'Pickup times are',
  ERROR: 'Oops. Looks like something went wrong.',
  LOCATION_FAILURE: 'There was an error with the Device Address API. Please try again.',
  GOODBYE: 'Bye!',
  UNHANDLED: 'This skill doesn\'t support that. Please ask something else.',
  HELP: 'You can use this skill by asking something like: when is the next garbage day?',
  STOP: 'Bye!'
};

// Constants
const PERMISSIONS = ['read::alexa:device:all:address'];
const TIME_ZONE = 'America/New_York';

/**
 * Returns number of days from today until dayTo parameter
 * @param {string} dayTo day to calculate to
 * @return {number} number of days between current day and dayTo
 */
const getDaysUntil = (dayTo) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const indexDayFrom = moment().tz(TIME_ZONE).day();
  const indexDayTo = days.indexOf(dayTo);

  if (indexDayTo >= indexDayFrom) {
    return indexDayTo - indexDayFrom;
  } else {
    return 7 + (indexDayTo - indexDayFrom);
  }
};

/**
 * Returns earliest garbage pickup day and days until then
 * @param {Array} dayTo garbage collection days
 * @return {Object} object containing earliest garbage pickup day and days until then
 */
const getNextGarbageDay = (garbageDays) => {
  // stuff days from now until next garbage day for each valid garbage day
  garbageDays.forEach((garbageDay, i) => {
    garbageDays[i] = { day: garbageDay, daysUntil: getDaysUntil(garbageDay) };
  });

  // get the closest garbage day
  return garbageDays.filter((garbageDay, i) => {
    if (i > 0) {
      return garbageDay.daysUntil < garbageDays[i - 1].daysUntil;
    }
  })[0];
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
 * Custom Intent Handler for retrieving garbage and recycling collection days
 */
const RefuseIntentHandler = {
  canHandle (handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    return request.type === 'IntentRequest' && request.intent.name === 'RefuseIntent';
  },
  async handle (handlerInput) {
    const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;

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
        reply = responseBuilder.speak(messages.WRONG_ADDRESS).getResponse();
      // require number and street address and zip code
      } else if (address.addressLine1 === null || address.postalCode === null) {
        reply = responseBuilder.speak(messages.NO_ADDRESS).getResponse();
      } else {
        // retrieve refuse collection data
        const { garbageDays, recyclingDay, residentialRoutingTime } =
          await getData(address.addressLine1, address.postalCode);

        // use RefuseType slot value for reply
        const refuseSlot = handlerInput.requestEnvelope.request.intent.slots.RefuseType;
        const refuseType = refuseSlot.value.trim().toLowerCase()
          .replace('trash', 'garbage')
          .replace('recycle', 'recycling');

        const nextRefuseDay = refuseType === 'garbage'
          ? getNextGarbageDay(garbageDays)
          : { day: recyclingDay, daysUntil: getDaysUntil(recyclingDay) };

        let output = `Your next ${refuseType} day is `;

        // collection day is today
        if (nextRefuseDay.daysUntil === 0) {
        // holiday schedule today
          if (await isHolidaySchedule()) {
            output = messages.HOLIDAY_SCHEDULE.replace('RefuseType', refuseType);
          } else {
            const routingTime = residentialRoutingTime.replace(/^Daily: /, '').replace(/ - /g, ' to ');

            // add collection times if collection day is today
            output += `today, ${nextRefuseDay.day}. ${messages.PICKUP_TODAY} ${routingTime}.`;
          }
        // collection day is tomorrow
        } else if (nextRefuseDay.daysUntil === 1) {
          output += `tomorrow, ${nextRefuseDay.day}. ${messages.PICKUP_TOMORROW.replace('RefuseType', refuseType)}`;
        // collection day is in a few days
        } else {
          output += `in ${nextRefuseDay.daysUntil} days, on ${nextRefuseDay.day}.`;
        }

        reply = responseBuilder.speak(output).getResponse();
      }

      return reply;
    } catch (err) {
      console.log(`error: ${JSON.stringify(err, null, 2)}`);

      if (err.name !== 'ServiceError') {
        const reply = responseBuilder.speak(messages.ERROR).getResponse();
        return reply;
      }

      throw err;
    }
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
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

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
    SessionEndedRequestHandler,
    HelpIntentHandler,
    CancelIntentHandler,
    StopIntentHandler,
    UnhandledIntentHandler
  )
  .addErrorHandlers(GetAddressErrorHandler)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();

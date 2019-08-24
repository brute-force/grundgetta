const Alexa = require('ask-sdk');
const moment = require('moment-timezone');
const { getData, isInCorrectTimezone, isHolidaySchedule } = require('./api-requests');

const messages = {
  WELCOME: 'Garbage!  Ask me \'when is the next garbage day?\' or \'when is the next recycling day?\'',
  WHAT_DO_YOU_WANT: 'What do you want to ask?',
  NOTIFY_MISSING_PERMISSIONS: 'Please enable Location permissions in the Amazon Alexa app.',
  NO_ADDRESS: 'You don\'t have an address set. Set your address in the companion app.',
  WRONG_ADDRESS: 'You don\'t have an address set in New York City. Considering moving.',
  HOLIDAY_SCHEDULE: 'Sanitation is on holiday schedule. Set your trash out after 4 pm today for pickup tomorrow.',
  ERROR: 'Oops. Looks like something went wrong.',
  UNRECOGNIZED_REFUSE_TYPE: 'Unrecognized refuse. Have you considered recycling?',
  LOCATION_FAILURE: 'There was an error with the Device Address API. Please try again.',
  GOODBYE: 'Bye!',
  UNHANDLED: 'This skill doesn\'t support that. Please ask something else.',
  HELP: 'You can use this skill by asking something like: when is the next garbage day?',
  STOP: 'Bye!'
};

// device address permissions
const PERMISSIONS = ['read::alexa:device:all:address'];
const TIME_ZONE = 'America/New_York';

// calculates number of days from today until provided day
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

// retrieve the next garbage day
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

/* INTENT HANDLERS */
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

      if (address.addressLine1 === null && address.stateOrRegion === null) {
        reply = responseBuilder.speak(messages.NO_ADDRESS).getResponse();
      } else if ((await isInCorrectTimezone(apiAccessToken, deviceId)) === false) {
        reply = responseBuilder.speak(messages.WRONG_ADDRESS).getResponse();
      } else {
        const refuseSlot = handlerInput.requestEnvelope.request.intent.slots.RefuseType;
        const refuseType = refuseSlot.value.toLowerCase();

        const { garbageDays, recyclingDay } = await getData(address.addressLine1, address.postalCode);

        // handle refuse type slot value
        const nextRefuseDay = refuseType === 'garbage'
          ? getNextGarbageDay(garbageDays)
          : { day: recyclingDay, daysUntil: getDaysUntil(recyclingDay) };

        let output = `Your next ${refuseType} day is `;

        if (nextRefuseDay.daysUntil === 0) {
          if (await isHolidaySchedule()) {
            output = messages.HOLIDAY_SCHEDULE;
          } else {
            output += `today, ${nextRefuseDay.day}.`;
          }
        } else if (nextRefuseDay.daysUntil === 1) {
          output += `tomorrow, ${nextRefuseDay.day}.`;
        } else {
          output += `in ${nextRefuseDay.daysUntil} days, on ${nextRefuseDay.day}.`;
        }

        reply = responseBuilder.speak(output).getResponse();
      }

      return reply;
    } catch (err) {
      if (err.name !== 'ServiceError') {
        const reply = responseBuilder.speak(messages.ERROR).getResponse();
        return reply;
      }

      console.log(`error: ${JSON.stringify(err, null, 2)}`);

      throw err;
    }
  }
};

const SessionEndedRequestHandler = {
  canHandle (handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle (handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  }
};

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

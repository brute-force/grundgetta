const Alexa = require('ask-sdk');
const request = require('superagent');

const messages = {
    WELCOME: 'Garbage!  Ask me \'when is the next garbage day?\' or \'when is the next recycling day?\'',
    WHAT_DO_YOU_WANT: 'What do you want to ask?',
    NOTIFY_MISSING_PERMISSIONS: 'Please enable Location permissions in the Amazon Alexa app.',
    NO_ADDRESS: 'You don\'t have an address set. Set your address in the companion app.',
    ERROR: 'Oops. Looks like something went wrong.',
    UNRECOGNIZED_REFUSE_TYPE: 'Unrecognized refuse. Have you considered recycling?',
    LOCATION_FAILURE: 'There was an error with the Device Address API. Please try again.',
    GOODBYE: 'Bye!',
    UNHANDLED: 'This skill doesn\'t support that. Please ask something else.',
    HELP: 'You can use this skill by asking something like: when is the next garbage day?',
    STOP: 'Bye!',
};

// device address permissions
const PERMISSIONS = ['read::alexa:device:all:address'];

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// calculates number of days from today until provided day
const getDaysUntil = (dayTo) => {
    const indexDayFrom = new Date().getDay();
    const indexDayTo = days.indexOf(dayTo);

    if (indexDayTo >= indexDayFrom) {
        return indexDayTo - indexDayFrom;
    } else {
        return 7 + (indexDayTo - indexDayFrom);
    }
};

// retrieve the next garbage day
const getNextGarbageDay = (garbageDays) => {
    const dayFrom = days[new Date().getDay()];

    // stuff days from now until next garbage day for each valid garbage day
    garbageDays.forEach((garbageDay, index) => garbageDays[index] = { day: garbageDay, daysUntil: getDaysUntil(garbageDay) });

    // get the closest garbage day
    return garbageDays.filter((garbageDay, index) => {
        if (index > 0) {
            return garbageDay.daysUntil < garbageDays[index - 1].daysUntil;
        }
    })[0];
};

// retrieve the garbage pickup days
const getData = async (numberAndStreet, zip) => {
    try {
        const uriDSNY = 'https://a827-donatenyc.nyc.gov/DSNYGeoCoder/api/DSNYCollection/CollectionSchedule?address=';
        const address = encodeURIComponent(`${numberAndStreet} ${zip}`);
        const { body: { RegularCollectionSchedule, RecyclingCollectionSchedule: recyclingDay } } = await request
            .get(`${uriDSNY}${address}`);

        const garbageDays = RegularCollectionSchedule.split(',');

        return { garbageDays, recyclingDay }
    } catch (err) {
        throw err;
    }
};

/* INTENT HANDLERS */
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.WELCOME)
            .reprompt(messages.WHAT_DO_YOU_WANT)
            .getResponse();
    },
};

const RefuseIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;

        return request.type === 'IntentRequest' && request.intent.name === 'RefuseIntent';
    },
    async handle(handlerInput) {
        const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;

        const consentToken = requestEnvelope.context.System.user.permissions
            && requestEnvelope.context.System.user.permissions.consentToken;

        if (!consentToken) {
            return responseBuilder
                .speak(messages.NOTIFY_MISSING_PERMISSIONS)
                .withAskForPermissionsConsentCard(PERMISSIONS)
                .getResponse();
        }

        try {
            const { deviceId } = requestEnvelope.context.System.device;
            const deviceAddressServiceClient = serviceClientFactory.getDeviceAddressServiceClient();
            const address = await deviceAddressServiceClient.getFullAddress(deviceId);

            let response;

            if (address.addressLine1 === null && address.stateOrRegion === null) {
                response = responseBuilder.speak(messages.NO_ADDRESS).getResponse();
            } else {
                const refuseSlot = handlerInput.requestEnvelope.request.intent.slots.RefuseType;
                const refuseType = refuseSlot.value.toLowerCase();

                const { garbageDays, recyclingDay } = await getData(address.addressLine1, address.postalCode);

                // handle refuse type slot value
                const nextRefuseDay = refuseType === 'garbage' 
                    ? getNextGarbageDay(garbageDays)
                    : { day: recyclingDay, daysUntil: getDaysUntil(recyclingDay)};

                let output = `Your next ${refuseType} day is `;

                if (nextRefuseDay.daysUntil === 0) {
                    output += `today, ${nextRefuseDay.day}.`;
                } else if (nextRefuseDay.daysUntil === 1) {
                    output += `tomorrow, ${nextRefuseDay.day}.`;
                } else {
                    output += `in ${nextRefuseDay.daysUntil} days, on ${nextRefuseDay.day}.`;
                }

                // const ADDRESS_MESSAGE = `${address.addressLine1}, ${address.stateOrRegion}, ${address.postalCode}`;
                response = responseBuilder.speak(output).getResponse();
            }

            return response;
        } catch (err) {
            if (err.name !== 'ServiceError') {
                const response = responseBuilder.speak(messages.ERROR).getResponse();
                return response;
            }

            throw err;
        }
    },
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

        return handlerInput.responseBuilder.getResponse();
    },
};

const UnhandledIntentHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.UNHANDLED)
            .reprompt(messages.UNHANDLED)
            .getResponse();
    },
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.HELP)
            .reprompt(messages.HELP)
            .getResponse();
    },
};

const CancelIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.CancelIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.GOODBYE)
            .getResponse();
    },
};

const StopIntentHandler = {
    canHandle(handlerInput) {
        const { request } = handlerInput.requestEnvelope;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.StopIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.STOP)
            .getResponse();
    },
};

const GetAddressErrorHandler = {
    canHandle(handlerInput, error) {
        return error.name === 'ServiceError';
    },
    handle(handlerInput, error) {
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
    },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        RefuseIntentHandler,
        SessionEndedRequestHandler,
        HelpIntentHandler,
        CancelIntentHandler,
        StopIntentHandler
    )
    .addErrorHandlers(GetAddressErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();

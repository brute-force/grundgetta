/**
 * Reply messages
 *
 * @constant
 * @default
 * @property {string} WELCOME - welcome message
 * @property {string} WHAT_DO_YOU_WANT - ask prompt
 * @property {string} NOTIFY_MISSING_PERMISSIONS - missing location permissions
 * @property {string} ADDRESS_MISSING - address not filled in in Amazon Alexa app
 * @property {string} ADDRESS_NOT_FOUND - address not in DSNY database
 * @property {string} TIME_ZONE_INVALID - time zone not set to New York in Amazon Alexa app
 * @property {string} SCHEDULE_NORMAL - normal collection schedule
 * @property {string} SCHEDULE_HOLIDAY - holiday collection schedule
 * @property {string} SCHEDULE_UNKNOWN - collection schedule not found or private
 * @property {string} PICKUP_TOMORROW - collection tomorrow
 * @property {string} PICKUP_TODAY - collection today
 * @property {string} ERROR - general error
 * @property {string} LOCATION_FAILURE - unable to retrieve device location
 * @property {string} GOODBYE - goodbye intent message
 * @property {string} UNHANDLED - unhandled intent message
 * @property {string} HELP - help intent message
 * @property {string} STOP - stop intent message
 */
const messages = {
  WELCOME: 'Ask me \'when is the next garbage day?\' or \'when is the next recycling day?\'',
  WHAT_DO_YOU_WANT: 'What do you want to ask?',
  NOTIFY_MISSING_PERMISSIONS: 'Please enable Location permissions in the Amazon Alexa app.',
  ADDRESS_MISSING: 'Set your address including street number, street, and zip code in the Amazon Alexa app.',
  ADDRESS_NOT_FOUND: 'Your address was not found in the Sanitation database. Is your residence legal?',
  TIME_ZONE_INVALID: 'Your time zone is not set to New York in the Amazon Alexa App. Consider moving.',
  SCHEDULE_NORMAL: 'Your next RefuseType day is',
  SCHEDULE_HOLIDAY: 'Sanitation is on holiday schedule. Set your RefuseType out after 4 PM today for pickup tomorrow.',
  SCHEDULE_UNKNOWN: 'Unable to find your RefuseType schedule. What even are you throwing out?',
  PICKUP_TOMORROW: 'Set your RefuseType out after 4 PM today.',
  PICKUP_TODAY: 'Pickup times are',
  ERROR: 'Oops! Looks like something went wrong.',
  LOCATION_FAILURE: 'There was an error with the Device Address API. Please try again.',
  GOODBYE: 'Bye!',
  UNHANDLED: 'This skill doesn\'t support that. Please ask something else.',
  HELP: 'You can use this skill by asking something like: when is the next garbage day?',
  STOP: 'Bye!'
};

/** @constant {string[]} - full device address permissions
 * @default
*/
const PERMISSIONS = ['read::alexa:device:all:address'];
/** @constant {string} - time zone for New York
 * @default
*/
const TIME_ZONE = 'America/New_York';

module.exports = {
  messages,
  PERMISSIONS,
  TIME_ZONE
};

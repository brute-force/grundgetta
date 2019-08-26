const moment = require('moment-timezone');
const { TIME_ZONE } = require('../constants');

/** @constant {string[]} - array of invalid collection codes
    @default
*/
const collectionSchedulesInvalid = ['NONE', 'EZ', 'Z', '', 'NO PICKUP', 'NO COLLECTION', 'PRIVATE COLLECTION'];

/** @constant {Object} - map of DSNY collection codes
 * @default
 * @property {string} 6X - Every day except Sunday
 * @property {string} TH - Thursday
 * @property {string} M - Monday
 * @property {string} T - Tuesday
 * @property {string} W - Wednesday
 * @property {string} F - Friday
 * @property {string} S - Saturday
*/
const collectionSchedulesMap = {
  '6X': 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday',
  TH: 'Thursday',
  M: 'Monday',
  T: 'Tuesday',
  W: 'Wednesday',
  F: 'Friday',
  S: 'Saturday'
};

/**
 * Validates collection schedule
 * @param {string} collectionSchedule - refuse collection schedule
 * @returns {boolean} - whether collection schedule is parseable
 */
const isValidCollectionSchedule = (collectionSchedule) => {
  return typeof collectionSchedule === 'string' && collectionSchedulesInvalid.indexOf(collectionSchedule) === -1;
};

/**
 * Decodes DSNY collection schedule to an array of days
 * @param {string} collectionSchedule - refuse collection schedule
 * @returns {string[]} - collection days
 */
const decodeCollectionSchedule = (collectionSchedule) => {
  // drop "E" (Every) designation since we're only looking at a week
  collectionSchedule = collectionSchedule.replace(/^E/, '');

  if (!isValidCollectionSchedule(collectionSchedule)) {
    return [];
  }

  let matched = '';
  const days = [];

  for (let i = 0; i < collectionSchedule.length; i++) {
    for (const key in collectionSchedulesMap) {
      if (collectionSchedule.substr(i, key.length) === key) {
        const value = collectionSchedulesMap[key];

        if (key === '6X') {
          days.push(...value);
        } else {
          days.push(value);
        }

        matched += key;
        break;
      }
    }

    if (matched === collectionSchedule) {
      break;
    }
  }

  return days;
};

/**
 * Returns number of days from today until dayTo parameter
 * @param {string} dayTo - day to calculate to
 * @return {number} - number of days between current day and dayToq
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
 * Returns earliest refuse pickup day and days until then
 * @param {string[]} dayTo - refuse collection days
 * @return {{day: string, daysUntil: number}} - earliest refuse pickup day and days until then
 */
const getNextRefuseDay = (refuseDays) => {
  // stuff days from now until next refuse day for each valid refuse day
  refuseDays.forEach((refuseDay, i) => {
    refuseDays[i] = { day: refuseDay, daysUntil: getDaysUntil(refuseDay) };
  });

  if (refuseDays.length === 1) {
    return refuseDays[0];
  }

  // find the minimum daysUntil
  const daysUntilMin = Math.min(...refuseDays.map(({ daysUntil }) => daysUntil));

  // filter by that minimum
  return refuseDays.filter(({ daysUntil }) => daysUntil === daysUntilMin)[0];
};

module.exports = {
  decodeCollectionSchedule,
  getNextRefuseDay
};

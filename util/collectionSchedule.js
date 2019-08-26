const collectionSchedulesInvalid = ['NONE', 'EZ', 'Z', '', 'NO PICKUP', 'NO COLLECTION', 'PRIVATE COLLECTION'];

// map of valid DSNY pickup codes
// https://www1.nyc.gov/assets/planning/download/pdf/data-maps/open-data/upg.pdf?r=16b
// convert these to days only for date calculations
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
 * @param {string} collectionSchedule - collectionSchedule refuse collection schedule
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

module.exports = decodeCollectionSchedule;

const request = require('superagent');
const AddressNotFoundError = require('./AddressNotFoundError');
const { decodeCollectionSchedule } = require('./collectionSchedule');

/**
 * Returns collection schedule for an address
 * @param {string} address - house/building street address and zip code
 * @return {{garbage: string[], recycling: string[], residentialRoutingTime: string}} - collection schedule
 * @throws {AddressNotFoundError} address not found in DSNY database
 */
const getData = async (address) => {
  const appId = process.env.GEOCLIENT_API_ID;
  const appKey = process.env.GEOCLIENT_APP_KEY;

  const uriGeoclient = 'https://api.cityofnewyork.us/geoclient/v1/search.json' +
    `?input=${encodeURIComponent(address)}&app_id=${appId}&app_key=${appKey}`;
  let response = await request.get(uriGeoclient);

  // nyc api geoclient/geocoder error
  if (response.body.status !== 'OK') {
    throw new AddressNotFoundError();
  }

  const {
    sanitationDistrict,
    sanitationCollectionSchedulingSectionAndSubsection,
    // sanitationBulkPickupSchedule,
    sanitationRegularCollectionSchedule,
    sanitationRecyclingCollectionSchedule
  } = response.body.results[0].response;

  const uriRoutingTime = 'https://www1.nyc.gov/apps/311utils/routingTime' +
    `?district=${sanitationDistrict}&section=${sanitationCollectionSchedulingSectionAndSubsection}`;
  response = await request.get(uriRoutingTime);

  const {
    body: {
      residentialRoutingTime
    }
  } = await request.get(uriRoutingTime);

  return {
    garbage: decodeCollectionSchedule(sanitationRegularCollectionSchedule),
    recycling: decodeCollectionSchedule(sanitationRecyclingCollectionSchedule),
    residentialRoutingTime
  };
};

/**
 * Validates time zone of Echo device against timeZone parameter via Alexa Settings API
 * @param {string} apiAccessToken - API access token for permissions lookup
 * @param {string} deviceId - device ID of device
 * @param {string} timeZone - time zone to compare against
 * @return {boolean} - whether device time zone is the same as timeZone parameter
 */
const isInCorrectTimezone = async (apiAccessToken, deviceId, timeZone) => {
  const uriTZ = `https://api.amazonalexa.com/v2/devices/${deviceId}/settings/System.timeZone`;
  const response = await request.get(uriTZ).set('Authorization', `Bearer ${apiAccessToken}`);

  return response.body === timeZone;
};

/**
 * Returns true if Sanitation holiday, false otherwise
 * @return {boolean} - whether current day is a Sanitation holiiday
 */
const isHolidaySchedule = async () => {
  const uriHolidaySchedule =
    'https://a827-donatenyc.nyc.gov/DSNYApi/api/Holidays/CheckSanitationHolidayToday';

  const { body: isHoliday } = await request.get(uriHolidaySchedule);

  return isHoliday;
};

module.exports = {
  getData,
  isInCorrectTimezone,
  isHolidaySchedule
};

const request = require('superagent');
const AddressNotFoundError = require('./AddressNotFoundError');

/**
 * Returns collection days and times for garbage pickups and recycling day for an address
 * @param {string} numberAndStreet number and street name
 * @param {number} zip zip code
 * @return {Object} collections days for garbage and recycling, including garbage collection times
 */
const getData = async (numberAndStreet, zip) => {
  const uriDSNY = 'https://a827-donatenyc.nyc.gov/DSNYGeoCoder/api/DSNYCollection/CollectionSchedule?address=';
  const address = encodeURIComponent(`${numberAndStreet} ${zip}`);

  const response = await request.get(`${uriDSNY}${address}`);

  if (response.body.FormattedAddress === null) {
    throw new AddressNotFoundError();
  }

  const {
    body: {
      RegularCollectionSchedule: garbageDays,
      RecyclingCollectionSchedule: recyclingDay,
      RoutingTime: {
        ResidentialRoutingTime: residentialRoutingTime,
        CommercialRoutingTime: commercialRoutingTime
      }
    }
  } = response;

  return { garbageDays: garbageDays.split(','), recyclingDay, residentialRoutingTime, commercialRoutingTime };
};

/**
 * Validates time zone of Echo device against timeZone parameter via Alexa Settings API
 * @param {string} apiAccessToken API access token for permissions lookup
 * @param {string} deviceId device ID of device
 * @param {string} timeZone time zone to compare against
 * @return {boolean} whether device time zone is the same as timeZone parameter
 */
const isInCorrectTimezone = async (apiAccessToken, deviceId, timeZone) => {
  const uriTZ = `https://api.amazonalexa.com/v2/devices/${deviceId}/settings/System.timeZone`;
  const response = await request.get(uriTZ).set('Authorization', `Bearer ${apiAccessToken}`);

  return response.body === timeZone;
};

/**
 * Returns true if Sanitation holiday, false otherwise
 * @return {boolean} whether current day is a Sanitation holiiday
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

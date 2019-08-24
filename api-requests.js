const request = require('superagent');

// retrieve the garbage pickup days
const getData = async (numberAndStreet, zip) => {
  const uriDSNY = 'https://a827-donatenyc.nyc.gov/DSNYGeoCoder/api/DSNYCollection/CollectionSchedule?address=';
  const address = encodeURIComponent(`${numberAndStreet} ${zip}`);
  const {
    body: {
      RegularCollectionSchedule,
      RecyclingCollectionSchedule: recyclingDay,
      RoutingTime: {
        ResidentialRoutingTime: residentialRoutingTime,
        CommercialRoutingTime: commercialRoutingTime
      }
    }
  } = await request.get(`${uriDSNY}${address}`);

  const garbageDays = RegularCollectionSchedule.split(',');

  return { garbageDays, recyclingDay, residentialRoutingTime, commercialRoutingTime };
};

const isInCorrectTimezone = async (apiAccessToken, deviceId, timeZone) => {
  const uriTZ = `https://api.amazonalexa.com/v2/devices/${deviceId}/settings/System.timeZone`;
  const response = await request.get(uriTZ).set('Authorization', `Bearer ${apiAccessToken}`);

  return response.body === timeZone;
};

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

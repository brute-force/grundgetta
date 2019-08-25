const sinon = require('sinon');
const expect = require('chai').expect;
const va = require('virtual-alexa');
const apiRequests = require('../api-requests');
const messages = require('../messages');
const AddressNotFoundError = require('../AddressNotFoundError');

const address = {
  addressLine1: '150 Orchard St.',
  addressLine2: 'Apt. 2A',
  addressLine3: '',
  city: 'New York',
  countryCode: 'US',
  districtOrCounty: 'New York',
  postalCode: '10002',
  stateOrRegion: 'NY'
};

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

describe('alexa skill test', function () {
  before(function () {
    // stub for valid time zone lookup tests
    const stubIsInCorrectTimezone = sinon.stub(apiRequests, 'isInCorrectTimezone').returns(true);

    // return false for invalid time zone tests
    stubIsInCorrectTimezone.onCall(16).returns(false);
    stubIsInCorrectTimezone.onCall(17).returns(false);

    // stub for collection today tests
    const stubGetData = sinon.stub(apiRequests, 'getData').callsFake(() => {
      return {
        garbageDays: [
          days[new Date().getDay()]
        ],
        recyclingDay: days[new Date().getDay()],
        residentialRoutingTime: 'Daily: 8:00 AM - 9:00 AM and 6:00 PM - 7:00 PM'
      };
    });

    // stub for collection tomorrow tests
    const getDataTomorrow = () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        garbageDays: [
          days[tomorrow.getDay()]
        ],
        recyclingDay: days[tomorrow.getDay()],
        residentialRoutingTime: 'Daily: 8:00 AM - 9:00 AM and 6:00 PM - 7:00 PM'
      };
    };

    stubGetData.onCall(8).callsFake(getDataTomorrow);
    stubGetData.onCall(9).callsFake(getDataTomorrow);
    stubGetData.onCall(10).callsFake(getDataTomorrow);
    stubGetData.onCall(11).callsFake(getDataTomorrow);

    // stub for collection day after tomorrow tests
    const getDataDayAfterTomorrow = () => {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      return {
        garbageDays: [
          days[dayAfterTomorrow.getDay()]
        ],
        recyclingDay: days[dayAfterTomorrow.getDay()],
        residentialRoutingTime: 'Daily: 8:00 AM - 9:00 AM and 6:00 PM - 7:00 PM'
      };
    };

    stubGetData.onCall(12).callsFake(getDataDayAfterTomorrow);
    stubGetData.onCall(13).callsFake(getDataDayAfterTomorrow);
    stubGetData.onCall(14).callsFake(getDataDayAfterTomorrow);
    stubGetData.onCall(15).callsFake(getDataDayAfterTomorrow);

    // stub for address not found
    const getDataAddressNotFound = () => {
      throw new AddressNotFoundError();
    };

    stubGetData.onCall(16).callsFake(getDataAddressNotFound);
    stubGetData.onCall(17).callsFake(getDataAddressNotFound);
    stubGetData.onCall(18).callsFake(getDataAddressNotFound);
    stubGetData.onCall(19).callsFake(getDataAddressNotFound);

    // stub false for regular collection schedule tests
    const stubIsHolidaySchedule = sinon.stub(apiRequests, 'isHolidaySchedule').returns(false);

    // return true for holiday colletion schedule tests
    stubIsHolidaySchedule.onCall(4).returns(true);
    stubIsHolidaySchedule.onCall(5).returns(true);
    stubIsHolidaySchedule.onCall(6).returns(true);
    stubIsHolidaySchedule.onCall(7).returns(true);
  });

  it('launch', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    const reply = await alexa.launch();
    expect(reply.prompt().replace(/<\/?speak>/g, '')).to.equal(messages.WELCOME);
  });

  it('when is the next garbage day? (today)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next garbage day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'garbage')} today`);
  });

  it('when is the next recycling day? (today)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next recycling day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'recycling')} today`);
  });

  it('when is the next trash day? (today)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next trash day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'garbage')} today`);
  });

  it('when is the next recycle day? (today)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycle day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'recycling')} today`);
  });

  it('when is the next garbage day? (today; holiday)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next garbage day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(`${messages.SCHEDULE_HOLIDAY.replace('RefuseType', 'garbage')}`);
  });

  it('when is the next recycling day? (today; holiday)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycling day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(`${messages.SCHEDULE_HOLIDAY.replace('RefuseType', 'recycling')}`);
  });

  it('when is the next trash day? (today; holiday)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next trash day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(`${messages.SCHEDULE_HOLIDAY.replace('RefuseType', 'garbage')}`);
  });

  it('when is the next recycle day? (today; holiday)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycle day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(`${messages.SCHEDULE_HOLIDAY.replace('RefuseType', 'recycling')}`);
  });

  it('when is the next garbage day? (tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next garbage day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'garbage')} tomorrow`);
  });

  it('when is the next recycling day? (tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next recycling day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'recycling')} tomorrow`);
  });

  it('when is the next trash day? (tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next trash day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'garbage')} tomorrow`);
  });

  it('when is the next recycle day? (tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycle day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'recycling')} tomorrow`);
  });

  it('when is the next garbage day? (day after tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next garbage day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'garbage')} in 2 days`);
  });

  it('when is the next recycling day? (day after tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next recycling day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'recycling')} in 2 days`);
  });

  it('when is the next trash day? (day after tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next trash day?');
    expect(reply.prompt()).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'garbage')} in 2 days`);
  });

  it('when is the next recycle day? (day after tomorrow)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycle day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.include(`${messages.SCHEDULE_NORMAL.replace('RefuseType', 'recycling')} in 2 days`);
  });

  it('when is the next garbage day? (invalid time zone)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next garbage day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(messages.TIME_ZONE_INVALID);
  });

  it('when is the next recycling day? (invalid time zone)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycling day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(messages.TIME_ZONE_INVALID);
  });

  it('when is the next garbage day? (address not found)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next garbage day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(messages.ADDRESS_NOT_FOUND);
  });

  it('when is the next recycling day? (address not found)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycling day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(messages.ADDRESS_NOT_FOUND);
  });
});

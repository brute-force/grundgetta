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
  let stubIsInCorrectTimezone, stubGetData, stubIsHolidaySchedule;

  before(function () {
    // stub external requests
    stubIsInCorrectTimezone = sinon.stub(apiRequests, 'isInCorrectTimezone');
    stubGetData = sinon.stub(apiRequests, 'getData');
    stubIsHolidaySchedule = sinon.stub(apiRequests, 'isHolidaySchedule');
  });

  describe('today', function () {
    before(function () {
      stubIsInCorrectTimezone.returns(true);

      stubGetData.callsFake(function () {
        return {
          garbageDays: [
            days[new Date().getDay()]
          ],
          recyclingDay: days[new Date().getDay()],
          residentialRoutingTime: 'Daily: 8:00 AM - 9:00 AM and 6:00 PM - 7:00 PM'
        };
      });

      stubIsHolidaySchedule.returns(false);
    });

    it('when is the next garbage day? (today; regular schedule)', async function () {
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
  });

  describe('today (holiday schedule)', function () {
    before(function () {
      stubIsHolidaySchedule.returns(true);
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
  });

  describe('tomorrow', function () {
    before(function () {
      // stub for collection tomorrow
      stubGetData.callsFake(function () {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        return {
          garbageDays: [
            days[tomorrow.getDay()]
          ],
          recyclingDay: days[tomorrow.getDay()],
          residentialRoutingTime: 'Daily: 8:00 AM - 9:00 AM and 6:00 PM - 7:00 PM'
        };
      });
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
  });

  describe('day after tomorrow', function () {
    before(function () {
      // stub for collection tomorrow
      stubGetData.callsFake(function () {
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        return {
          garbageDays: [
            days[dayAfterTomorrow.getDay()]
          ],
          recyclingDay: days[dayAfterTomorrow.getDay()],
          residentialRoutingTime: 'Daily: 8:00 AM - 9:00 AM and 6:00 PM - 7:00 PM'
        };
      });
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
  });

  describe('invalid time zone', function () {
    before(function () {
      stubIsInCorrectTimezone.returns(false);
    });

    after(function () {
      stubIsInCorrectTimezone.returns(true);
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
  });

  describe('address not found', function () {
    before(function () {
      stubGetData.throws(new AddressNotFoundError());
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
});

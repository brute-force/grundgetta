const sinon = require('sinon');
const expect = require('chai').expect;
const va = require('virtual-alexa');
const apiRequests = require('../api-requests');
const messages = require('../messages');

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

describe('alexa skill test', function () {
  before(function () {
    const stub = sinon.stub(apiRequests, 'isInCorrectTimezone').returns(true);
    // return invalid timezone lookups for 3rd and 4th tests
    stub.onCall(4).returns(false);
    stub.onCall(5).returns(false);
  });

  it('launch', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    const reply = await alexa.launch();
    expect(reply.prompt().replace(/<\/?speak>/g, '')).to.equal(messages.WELCOME);
  });

  it('when is the next garbage day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next garbage day?');
    expect(reply.prompt()).to.include(`${messages.NORMAL_SCHEDULE.replace('RefuseType', 'garbage')}`);
  });

  it('when is the next recycling day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next recycling day?');
    expect(reply.prompt()).to.include(`${messages.NORMAL_SCHEDULE.replace('RefuseType', 'recycling')}`);
  });

  it('when is the next trash day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next trash day?');
    expect(reply.prompt()).to.include(`${messages.NORMAL_SCHEDULE.replace('RefuseType', 'garbage')}`);
  });

  it('when is the next recycle day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycle day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.include(`${messages.NORMAL_SCHEDULE.replace('RefuseType', 'recycling')}`);
  });

  it('when is the next garbage day? (wrong time zone)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next garbage day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(messages.TIME_ZONE_WRONG);
  });

  it('when is the next recycling day? (wrong time zone)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycling day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(messages.TIME_ZONE_WRONG);
  });

  it('when is the next garbage day? (address not found)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    address.addressLine1 = '1000 Main St.';

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

    address.addressLine1 = '1000 Main St.';
    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    let reply = await alexa.utter('when is the next recycling day?');
    reply = reply.prompt().replace(/<\/?speak>/g, '');
    expect(reply).to.equal(messages.ADDRESS_NOT_FOUND);
  });
});

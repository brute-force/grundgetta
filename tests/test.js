const sinon = require('sinon');
const expect = require('chai').expect;
const va = require('virtual-alexa');
const apiRequests = require('../api-requests');

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

  it('open garbageman', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    const result = await alexa.launch();
    expect(result.prompt()).to.include('Ask me');
  });

  it('when is the next garbage day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next garbage day?');
    expect(reply.prompt()).to.include('Your next garbage day is');
  });

  it('when is the next recycling day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next recycling day?');
    expect(reply.prompt()).to.include('Your next recycling day is');
  });

  it('when is the next trash day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next trash day?');
    expect(reply.prompt()).to.include('Your next garbage day is');
  });

  it('when is the next recycle day?', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next recycle day?');
    expect(reply.prompt()).to.include('Your next recycling day is');
  });

  it('when is the next garbage day? (invalid address)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next garbage day?');
    expect(reply.prompt()).to.include('Consider moving.');
  });

  it('when is the next recycling day? (invalid address)', async function () {
    const alexa = va.VirtualAlexa.Builder()
      .handler('index.handler')
      .interactionModelFile('./models/en-US.json')
      .create();

    alexa.addressAPI().returnsFullAddress(address);

    await alexa.launch();
    const reply = await alexa.utter('when is the next recycling day?');
    expect(reply.prompt()).to.include('Consider moving.');
  });
});

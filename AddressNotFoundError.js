class AddressNotFoundError extends Error {
  constructor () {
    super('Address not found in DSNY database.');
    this.name = 'AddressNotFoundError';
    Error.captureStackTrace(this, AddressNotFoundError);
  }
}

module.exports = AddressNotFoundError;

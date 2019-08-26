/**
 * Constructs an AddressNotFoundError object with specified message.
 *
 * @classdesc
 *
 * Error for addresses not found in the DSNY database.
 *
 * @constructor
 * @param {string} [message='Address not found in DSNY database.] error message
 */
class AddressNotFoundError extends Error {
  constructor (message = 'Address not found in DSNY database.') {
    super(message);
    this.name = 'AddressNotFoundError';
    Error.captureStackTrace(this, AddressNotFoundError);
  }
}

module.exports = AddressNotFoundError;

/**
 * Mocks Mongoose model methods for testing.
 * 
 * This utility method enables testing of code that interacts with Mongoose model database operations. 
 * All standard query chain methods return the model itself to support chaining.
 * 
 * @param {*} model The Mongoose model object to be mocked.
 * @returns {*} An object containing the helper functions `mockResolvedValue` and `mockDatabaseFailure`
 * 
 * @example
 * const { mockResolvedValue, mockDatabaseFailure } = mockModel(productModel);
 * mockResolvedValue('estimatedDocumentCount', 3);
 */
export const mockModel = (model) => {
  const ops = [
    'find', 'findOne', 'findById', 'populate',
    'select', 'skip', 'limit', 'sort', 'estimatedDocumentCount', 'save',
  ];

  ops.forEach((method) => {
    model[method] = jest.fn().mockReturnValue(model);
  })

  /**
   * Configures a model method to resolve with a specified value.
   * @param {string} method The method to mock
   * @param {any} value The value that the method should resolve with
   * @returns {jest.Mock} The mocked method
   * 
   * @throws {Error} If the specified method is not supported
   */
  const mockResolvedValue = (method, value) => {
    if (!ops.includes(method)) {
      throw new Error(`Method ${method} not found`);
    }
    model[method] = jest.fn().mockResolvedValue(value);
    return model[method];
  }

   /**
   * Configures a model method to reject with a database error.
   * @param {string} method The method to mock
   * @returns {jest.Mock} The mocked method
   * 
   * @throws {Error} If the specified method is not supported
   */
  const mockDatabaseFailure = (method) => {
    const error = new Error('Database failure');
    if (!ops.includes(method)) {
      throw new Error(`Method ${method} not found`);
    }
    model[method] = jest.fn().mockRejectedValue(error);
    return model[method];
  }

  return { mockResolvedValue, mockDatabaseFailure };
};

/**
 * Asserts that a response indicates a database error.
 * 
 * This helper verifies that
 * 1. The response status is 500
 * 2. The response body contains an object with `success: false`, a `message` string, and an `error` string.
 * 3. The error was logged
 * @param {jest.Mock} res The mocked response object, typically contaiing `status` and `send`
 * @param {jest.Mock} logSpy A spy function to confirm the error was logged
 */
export const expectDatabaseError = (res, logSpy) => {
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
    success: false,
    message: expect.any(String),
    error: expect.any(String),
  }));

  expect(logSpy).toHaveBeenCalledTimes(1);
  logSpy.mockRestore();
};

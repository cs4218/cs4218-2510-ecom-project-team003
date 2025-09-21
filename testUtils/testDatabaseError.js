import mockModel from "./mockModel";

const testDatabaseError = async (controller, model, method, params) => {
  const [req, res] = mockRequestResponse(params);
  const spy = jest.spyOn(console, 'log').mockImplementation();
  const err = new Error('Database error');
  mockModel(model).mockRejectedValue(method, err);

  await controller(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
    success: false,
    message: expect.any(String),
    error: expect.any(String),
  }));

  spy.mockRestore();
};

const testDatabaseLogError = async (controller, model, method, params) => {
  const [req, res] = mockRequestResponse(params);
  const spy = jest.spyOn(console, 'log').mockImplementation();
  const err = new Error('Database error');
  mockModel(model).mockRejectedValue(method, err);

  await controller(req, res);

  expect(spy).toHaveBeenCalledWith(err);

  spy.mockRestore();
};

export { testDatabaseError, testDatabaseLogError };
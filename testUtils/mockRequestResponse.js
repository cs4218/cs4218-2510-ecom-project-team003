export default mockRequestResponse = (params = {}) => {
  const req = { params };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    set: jest.fn(),
    json: jest.fn()
  };
  return [req, res];
};

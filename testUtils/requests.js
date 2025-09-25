const mockRequestResponse = ({ params = {}, body = {} } = {}) => {
  const req = { params, body };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    set: jest.fn(),
    json: jest.fn()
  };
  return [req, res];
};

export default mockRequestResponse;

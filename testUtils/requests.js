export default mockRequestResponse = ({ params = {}, body = {}, user = {} } = {}) => {
  const req = { params, body, user };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    set: jest.fn(),
    json: jest.fn()
  };
  return [req, res];
};

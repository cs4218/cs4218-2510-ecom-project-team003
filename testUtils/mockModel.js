export default mockModel = (model) => {
  const ops = [
    'find', 'findOne', 'findById', 'populate',
    'select', 'skip', 'limit', 'sort',
  ];

  ops.forEach((method) => {
    model[method] = jest.fn().mockReturnValue(model);
  })

  const mockResolvedValue = (method, value) => {
    if (!ops.includes(method)) {
      throw new Error(`Method ${method} not found`);
    }
    model[method] = jest.fn().mockResolvedValue(value);
  }

  const mockRejectedValue = (method, error) => {
    if (!ops.includes(method)) {
      throw new Error(`Method ${method} not found`);
    }
    model[method] = jest.fn().mockRejectedValue(error);
  }

  return { mockResolvedValue, mockRejectedValue };
};

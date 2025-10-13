export const ELECTRONICS = {
  _id: '68e3f943282387623f0a0736',
  name: 'Electronics',
  slug: 'electronics',
}

export const LAPTOP = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Laptop',
  slug: 'laptop',
  description: 'A powerful laptop',
  price: 1499.99,
  category: ELECTRONICS._id,
  quantity: 30,
};

export const SMARTPHONE = {
  _id: '68e3f943282387623f0a0738',
  name: 'Smartphone',
  slug: 'smartphone',
  description: 'A high-end smartphone',
  price: 999.99,
  category: ELECTRONICS._id,
  quantity: 50,
};

export const TABLET = {
  _id: '68e3f943282387623f0a0746',
  name: 'Tablet',
  slug: 'tablet',
  description: 'A sleek tablet with high performance',
  price: 599.99,
  category: ELECTRONICS._id,
  quantity: 40,
};

export const USER = {
  _id: 'a1b2c3d4e5f6789012345678',
  name: 'John Doe',
  email: 'johndoe@gmail.com',
  password: 'dont care value',
  phone: '91234567',
  address: '123 Main St, City, Country',
  answer: 'security answer',
  role: 0,
};

export const ADMIN = {
  _id: 'a1b2c3d4e5f6789012345679',
  name: 'Admin User',
  email: 'Administrator@gmail.com',
  password: 'dont care value',
  phone: '98765432',
  address: '456 Admin Rd, City, Country',
  answer: 'admin security answer',
  role: 1,
};

export const ORDER_TWO_ITEMS = {
  _id: 'a1b2c3d4e5f6789012345680',
  products: [LAPTOP._id, SMARTPHONE._id],
  status: 'Processing',
  buyer: USER._id,
  createAt: new Date().toISOString(),
  payment: { success: true },
}

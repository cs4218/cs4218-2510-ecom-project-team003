export const ELECTRONICS = {
  _id: '68e3f943282387623f0a0736',
  name: 'Electronics',
  slug: 'electronics',
}

export const BOOKS = {
    _id: '66db427fdb0119d9234b27f1',
    name: 'Books',
    slug: 'books',
};

export const LAPTOP = {
  name: 'Laptop',
  slug: 'laptop',
  description: 'A powerful laptop',
  price: 1499.99,
  category: ELECTRONICS._id,
  quantity: 30,
};

export const SMARTPHONE = {
  name: 'Smartphone',
  slug: 'smartphone',
  description: 'A high-end smartphone',
  price: 999.99,
  category: ELECTRONICS._id,
  quantity: 50,
};

export const TABLET = {
  name: 'Tablet',
  slug: 'tablet',
  description: 'A sleek tablet with high performance',
  price: 599.99,
  category: ELECTRONICS._id,
  quantity: 40,
};
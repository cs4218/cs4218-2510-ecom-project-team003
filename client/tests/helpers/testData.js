export const ELECTRONICS = {
  _id: '68e3f943282387623f0a0736',
  name: 'Electronics',
  slug: 'electronics',
};

export const BOOKS = {
    _id: "68e3f943282387623f0a0737",
    name: "Books",
    slug: "books",
};
export const CLOTHING = {
    _id: "68e3f943282387623f0a0738",
    name: "Clothing",
    slug: "clothing",
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

export const STUDY_GUIDE = {
    name: "Study Guide",
    slug: "study-guide",
    description: "Concise exam study guide",
    price: 22,
    category: BOOKS._id,
    quantity: 200,
};

export const SINGAPORE_CONTRACT_LAW = {
    name: "Singapore Contract Law",
    slug: "singapore-contract-law",
    description: "The definitive text on contract law",
    price: 70,
    category: BOOKS._id,
    quantity: 80,
};

export const CAMPUS_HOODIE = {
    name: "Campus Hoodie",
    slug: "campus-hoodie",
    description: "Cozy cotton hoodie",
    price: 55,
    category: CLOTHING._id,
    quantity: 90,
};

export const LEATHER_JACKET = {
    name: "Leather Jacket",
    slug: "leather-jacket",
    description: "Premium leather outerwear",
    price: 150,
    category: CLOTHING._id,
    quantity: 25,
};
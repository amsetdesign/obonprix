export type Category = {
  slug: string;
  name: string;
  emoji: string;
  gradient: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  oldPrice?: number;
  unit: string;
  emoji: string;
  description: string;
  inStock: boolean;
  featured: boolean;
  badge?: string;
};

export type CartLine = {
  productId: string;
  quantity: number;
};

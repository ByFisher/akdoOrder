export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  isActive: boolean;
  productCount?: number;
}

export interface MenuProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  allergens: string[];
  stock: number;
  isActive: boolean;
  featured: boolean;
  category: MenuCategory;
}

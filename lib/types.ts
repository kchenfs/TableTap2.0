export interface OptionItem {
  name: string;
  priceModifier: number;
}

export interface OptionGroup {
  name: string;
  type: 'VARIANT' | 'ADD_ON';
  required: boolean;
  items: OptionItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  Price: number;
  category: string;
  location: string;
  options: OptionGroup[];
  tags?: string[];
  imageUrl?: string; // CloudFront URL e.g. https://dXXX.cloudfront.net/images/item.jpg
}

export interface APIMenuItem {
  ItemNumber: string;
  ItemName: string;
  Description: string;
  Price: number;
  Category: string;
  Location: string;
  Tags?: string[]; // SS from DynamoDB comes through as string[]
  Options?: OptionGroup[];
  ImageUrl?: string; // Optional — items without a photo fall back to a placeholder
}

export interface CartItem {
  cartId: string;
  menuItem: MenuItem;
  selectedOptions: Record<string, OptionItem>;
  quantity: number;
  finalPrice: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

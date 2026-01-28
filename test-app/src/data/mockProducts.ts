export interface MockProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  tags: string[];
}

export const mockProducts: MockProduct[] = [
  {
    id: 1,
    name: "Wireless Bluetooth Headphones",
    category: "Electronics",
    price: 79.99,
    rating: 4.5,
    reviews: 1284,
    image: "https://picsum.photos/300/300?random=1",
    description: "Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio quality. Perfect for music lovers and commuters.",
    tags: ["wireless", "bluetooth", "noise-cancelling", "audio", "portable"]
  },
  {
    id: 2,
    name: "Cotton Crew Neck T-Shirt",
    category: "Clothing",
    price: 24.99,
    rating: 4.2,
    reviews: 856,
    image: "https://picsum.photos/300/300?random=2",
    description: "Classic fit 100% organic cotton t-shirt. Soft, breathable fabric perfect for everyday wear. Available in multiple colors and sizes.",
    tags: ["cotton", "casual", "organic", "basics", "comfortable"]
  },
  {
    id: 3,
    name: "Smart LED Desk Lamp",
    category: "Home",
    price: 49.99,
    rating: 4.7,
    reviews: 432,
    image: "https://picsum.photos/300/300?random=3",
    description: "Adjustable LED desk lamp with touch controls, 5 brightness levels, and 3 color temperatures. USB charging port included. Eye-friendly lighting for work or study.",
    tags: ["smart", "LED", "adjustable", "USB", "office"]
  },
  {
    id: 4,
    name: "Professional Yoga Mat",
    category: "Sports",
    price: 39.99,
    rating: 4.8,
    reviews: 2156,
    image: "https://picsum.photos/300/300?random=4",
    description: "Extra thick 6mm eco-friendly yoga mat with non-slip surface. Includes carrying strap. Perfect for yoga, pilates, and floor exercises.",
    tags: ["yoga", "fitness", "eco-friendly", "non-slip", "exercise"]
  },
  {
    id: 5,
    name: "Stainless Steel Water Bottle",
    category: "Sports",
    price: 29.99,
    rating: 4.6,
    reviews: 1893,
    image: "https://picsum.photos/300/300?random=5",
    description: "Double-wall vacuum insulated water bottle keeps drinks cold for 24 hours or hot for 12 hours. BPA-free, leak-proof lid. 32oz capacity.",
    tags: ["insulated", "stainless-steel", "BPA-free", "hydration", "reusable"]
  },
  {
    id: 6,
    name: "Wireless Charging Pad",
    category: "Electronics",
    price: 34.99,
    rating: 4.3,
    reviews: 678,
    image: "https://picsum.photos/300/300?random=6",
    description: "Fast wireless charging pad compatible with all Qi-enabled devices. Sleek, slim design with LED indicator and anti-slip surface.",
    tags: ["wireless", "charging", "Qi", "fast-charge", "universal"]
  },
  {
    id: 7,
    name: "Memory Foam Pillow",
    category: "Home",
    price: 59.99,
    rating: 4.4,
    reviews: 1245,
    image: "https://picsum.photos/300/300?random=7",
    description: "Contoured memory foam pillow with cooling gel layer. Ergonomic design supports neck and spine alignment. Hypoallergenic and dust-mite resistant.",
    tags: ["memory-foam", "cooling", "ergonomic", "sleep", "hypoallergenic"]
  },
  {
    id: 8,
    name: "Running Shoes",
    category: "Sports",
    price: 119.99,
    rating: 4.7,
    reviews: 3421,
    image: "https://picsum.photos/300/300?random=8",
    description: "Lightweight running shoes with responsive cushioning and breathable mesh upper. Designed for neutral runners seeking comfort on long runs.",
    tags: ["running", "athletic", "breathable", "cushioned", "lightweight"]
  },
  {
    id: 9,
    name: "Denim Jacket",
    category: "Clothing",
    price: 89.99,
    rating: 4.5,
    reviews: 567,
    image: "https://picsum.photos/300/300?random=9",
    description: "Classic denim jacket with button closure and chest pockets. Timeless style that pairs with any outfit. Pre-washed for a lived-in look.",
    tags: ["denim", "jacket", "classic", "casual", "layering"]
  },
  {
    id: 10,
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    price: 59.99,
    rating: 4.4,
    reviews: 2089,
    image: "https://picsum.photos/300/300?random=10",
    description: "Compact waterproof Bluetooth speaker with 360-degree sound. 12-hour battery life, built-in microphone for calls. Perfect for outdoor adventures.",
    tags: ["bluetooth", "speaker", "waterproof", "portable", "outdoor"]
  },
  {
    id: 11,
    name: "Ceramic Plant Pot Set",
    category: "Home",
    price: 44.99,
    rating: 4.6,
    reviews: 389,
    image: "https://picsum.photos/300/300?random=11",
    description: "Set of 3 minimalist ceramic plant pots with drainage holes and bamboo trays. Modern matte finish. Perfect for succulents and small plants.",
    tags: ["ceramic", "plants", "minimalist", "indoor", "decor"]
  },
  {
    id: 12,
    name: "Fitness Resistance Bands Set",
    category: "Sports",
    price: 24.99,
    rating: 4.5,
    reviews: 1678,
    image: "https://picsum.photos/300/300?random=12",
    description: "Set of 5 resistance bands with varying resistance levels. Includes door anchor, handles, and ankle straps. Great for home workouts and physical therapy.",
    tags: ["resistance", "fitness", "home-workout", "strength", "portable"]
  },
  {
    id: 13,
    name: "Smartwatch Fitness Tracker",
    category: "Electronics",
    price: 149.99,
    rating: 4.3,
    reviews: 2567,
    image: "https://picsum.photos/300/300?random=13",
    description: "Advanced fitness smartwatch with heart rate monitoring, GPS tracking, and sleep analysis. Water-resistant with 7-day battery life. Compatible with iOS and Android.",
    tags: ["smartwatch", "fitness", "GPS", "heart-rate", "waterproof"]
  },
  {
    id: 14,
    name: "Wool Blend Sweater",
    category: "Clothing",
    price: 79.99,
    rating: 4.6,
    reviews: 423,
    image: "https://picsum.photos/300/300?random=14",
    description: "Cozy wool blend crewneck sweater with ribbed cuffs and hem. Soft, breathable fabric perfect for layering in cooler weather.",
    tags: ["wool", "sweater", "warm", "layering", "winter"]
  }
];

// Helper functions
export const getMockProductsByCategory = (category: string): MockProduct[] => {
  return mockProducts.filter(product => product.category === category);
};

export const getMockProductById = (id: number): MockProduct | undefined => {
  return mockProducts.find(product => product.id === id);
};

export const searchMockProducts = (query: string): MockProduct[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockProducts.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getMockProductsByPriceRange = (min: number, max: number): MockProduct[] => {
  return mockProducts.filter(product => product.price >= min && product.price <= max);
};

export const getMockProductsByRating = (minRating: number): MockProduct[] => {
  return mockProducts.filter(product => product.rating >= minRating);
};

export const getMockCategories = (): string[] => {
  return [...new Set(mockProducts.map(product => product.category))];
};

export const getAllMockTags = (): string[] => {
  const allTags = mockProducts.flatMap(product => product.tags);
  return [...new Set(allTags)];
};

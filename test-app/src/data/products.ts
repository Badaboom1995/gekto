export interface Product {
  id: string;
  name: string;
  category: 'Desktop' | 'Laptop' | 'Workstation' | 'Gaming' | 'Portable';
  price: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  tags: string[];
}

export const products: Product[] = [
  {
    id: 'macintosh-128k',
    name: 'Apple Macintosh 128K',
    category: 'Desktop',
    price: 2499,
    rating: 4.8,
    reviews: 342,
    image: 'http://www.vintagemacmuseum.com/images/mac128k.jpg',
    description: 'The original Macintosh that started a revolution. Released in 1984, this iconic computer introduced the masses to the graphical user interface and mouse-driven computing. Features 128KB of RAM and a built-in 9-inch monochrome display.',
    tags: ['Apple', 'Macintosh', '1984', 'GUI', 'vintage', 'collector', 'iconic']
  },
  {
    id: 'commodore-64',
    name: 'Commodore 64',
    category: 'Gaming',
    price: 599,
    rating: 4.9,
    reviews: 456,
    image: 'https://www.digibarn.com/collections/systems/commodore64/TN_DSC08320.JPG',
    description: 'The best-selling single personal computer model of all time. With its advanced graphics and sound capabilities for its era, the C64 became the platform of choice for gamers and hobbyists worldwide.',
    tags: ['Commodore', 'C64', '1982', 'gaming', 'SID chip', '8-bit', 'BASIC']
  },
  {
    id: 'amiga-500',
    name: 'Commodore Amiga 500',
    category: 'Gaming',
    price: 899,
    rating: 4.7,
    reviews: 389,
    image: 'https://www.vintagecomputer.net/commodore/amiga_500/amiga-500_box.jpg',
    description: 'The multimedia powerhouse of the late 1980s. The Amiga 500 featured groundbreaking graphics and audio capabilities, making it a favorite among gamers, artists, and video professionals.',
    tags: ['Amiga', 'Commodore', '1987', 'multimedia', 'gaming', '16-bit', 'demoscene']
  },
  {
    id: 'atari-800',
    name: 'Atari 800',
    category: 'Gaming',
    price: 499,
    rating: 4.5,
    reviews: 198,
    image: 'https://www.digibarn.com/collections/systems/atari-400/TN_DSC08389.JPG',
    description: "Atari's flagship home computer from 1979. Known for its robust build quality, advanced graphics, and extensive game library. Features custom ANTIC and POKEY chips for superior audiovisual performance.",
    tags: ['Atari', '1979', 'gaming', '8-bit', 'cartridge', 'vintage']
  },
  {
    id: 'apple-ii',
    name: 'Apple II',
    category: 'Desktop',
    price: 1299,
    rating: 4.7,
    reviews: 312,
    image: 'https://www.digibarn.com/collections/systems/appleII/TN_DSC04302.JPG',
    description: 'The computer that built Apple. Released in 1977, the Apple II was one of the first successful mass-produced microcomputers. Its color graphics and expansion slots made it a versatile platform for business and education.',
    tags: ['Apple', '1977', 'Wozniak', '6502', 'color graphics', 'vintage', 'education']
  },
  {
    id: 'next-cube',
    name: 'NeXT Cube',
    category: 'Workstation',
    price: 4999,
    rating: 4.6,
    reviews: 89,
    image: 'https://www.digibarn.com/collections/systems/next-cube/TN_DSC02119.JPG',
    description: "Steve Jobs' post-Apple masterpiece. The NeXT Cube featured revolutionary object-oriented programming environment and was used by Tim Berners-Lee to create the World Wide Web. A true piece of computing history.",
    tags: ['NeXT', 'Steve Jobs', '1988', 'workstation', 'Unix', 'NeXTSTEP', 'WWW']
  },
  {
    id: 'apple-lisa',
    name: 'Apple Lisa',
    category: 'Desktop',
    price: 4499,
    rating: 4.3,
    reviews: 45,
    image: 'https://www.digibarn.com/collections/systems/apple-lisa1/TN_DSC07211.JPG',
    description: 'The first personal computer with a graphical user interface sold commercially. Though a commercial failure, the Lisa pioneered many concepts that would later appear in the Macintosh and influence all modern computing.',
    tags: ['Apple', 'Lisa', '1983', 'GUI', 'rare', 'collector', 'historic']
  },
  {
    id: 'macintosh-se30',
    name: 'Macintosh SE/30',
    category: 'Desktop',
    price: 1899,
    rating: 4.8,
    reviews: 234,
    image: 'http://www.vintagemacmuseum.com/images/mac_se30.jpg',
    description: 'The greatest compact Mac ever built. The SE/30 packed a powerful 68030 processor into the classic compact Macintosh form factor, offering expandability and performance that made it a favorite for years.',
    tags: ['Apple', 'Macintosh', '1989', '68030', 'compact Mac', 'expandable']
  }
];

export const categories = ['Desktop', 'Laptop', 'Workstation', 'Gaming', 'Portable'] as const;

export type Category = typeof categories[number];

export const getProductsByCategory = (category: Product['category']): Product[] => {
  return products.filter(product => product.category === category);
};

export const getProductById = (id: string): Product | undefined => {
  return products.find(product => product.id === id);
};

export const searchProducts = (query: string): Product[] => {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(product =>
    product.name.toLowerCase().includes(lowercaseQuery) ||
    product.description.toLowerCase().includes(lowercaseQuery) ||
    product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getProductsByPriceRange = (min: number, max: number): Product[] => {
  return products.filter(product => product.price >= min && product.price <= max);
};

export const getProductsByRating = (minRating: number): Product[] => {
  return products.filter(product => product.rating >= minRating);
};

export const getFeaturedProducts = (limit: number = 4): Product[] => {
  return [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

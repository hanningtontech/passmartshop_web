import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getDb() {
  if (!getApps().length) {
    // Uses GOOGLE_APPLICATION_CREDENTIALS or default credentials
    initializeApp();
  }
  return getFirestore();
}

async function clearCollection(collectionName: string) {
  const db = getDb();
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    console.log(`Collection "${collectionName}" is already empty.`);
    return;
  }

  console.log(`Deleting ${snapshot.size} document(s) from "${collectionName}"...`);

  const batchSize = 500;
  let docs = snapshot.docs;

  while (docs.length > 0) {
    const batch = db.batch();
    const chunk = docs.slice(0, batchSize);

    for (const doc of chunk) {
      batch.delete(doc.ref);
    }

    await batch.commit();
    docs = docs.slice(batchSize);
  }

  console.log(`Finished deleting documents from "${collectionName}".`);
}

type CategoryNode = {
  id: string;
  name: string;
  children?: CategoryNode[];
};

type CategorySeed = {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  tree?: CategoryNode[]; // nested subcategory structure
};

type ProductSeed = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  featured?: boolean;
  isNew?: boolean;
  inStock?: boolean;
  rating?: number;
  images?: string[];
  attributes?: Record<string, any>;
};

// New top-level categories you described, with nested subcategory tree where provided.
const CATEGORIES: CategorySeed[] = [
  {
    id: "home-kitchen",
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Cookware, storage, decor, and cleaning essentials.",
    displayOrder: 1,
    tree: [
      {
        id: "arts-crafts-sewing",
        name: "Arts, Crafts & Sewing",
        children: [
          {
            id: "printmaking",
            name: "Printmaking",
            children: [
              { id: "screen-printing", name: "Screen Printing" },
              { id: "relief-block-printing-materials", name: "Relief & Block Printing Materials" },
              { id: "printmaking-inks", name: "Printmaking Inks" },
              { id: "printing-presses-accessories", name: "Printing Presses & Accessories" },
              { id: "heat-press-machines-accessories", name: "Heat Press Machines & Accessories" },
              { id: "etching-supplies", name: "Etching Supplies" },
            ],
          },
          {
            id: "painting-drawing-art-supplies",
            name: "Painting, Drawing & Art Supplies",
          },
          {
            id: "organization-storage-transport",
            name: "Organization, Storage & Transport",
          },
          {
            id: "beading-jewelry-making",
            name: "Beading & Jewelry Making",
          },
          {
            id: "crafting",
            name: "Crafting",
          },
          {
            id: "knitting-crochet",
            name: "Knitting & Crochet",
          },
          {
            id: "gift-wrapping-supplies",
            name: "Gift Wrapping Supplies",
          },
          {
            id: "needlework",
            name: "Needlework",
          },
          {
            id: "fabric-decorating",
            name: "Fabric Decorating",
          },
          {
            id: "fabric",
            name: "Fabric",
          },
          {
            id: "sewing",
            name: "Sewing",
            children: [
              {
                id: "trim-embellishments",
                name: "Trim & Embellishments",
                children: [
                  { id: "tassels", name: "Tassels" },
                  { id: "sequin-trim", name: "Sequin Trim" },
                  { id: "ruffle-trim", name: "Ruffle Trim" },
                  { id: "rick-rack", name: "Rick Rack" },
                  { id: "ribbons", name: "Ribbons" },
                  { id: "rhinestones-sequins", name: "Rhinestones & Sequins" },
                  { id: "piping", name: "Piping" },
                  { id: "lace", name: "Lace" },
                  { id: "iron-on-transfers", name: "Iron-on Transfers" },
                  { id: "fringe-trim", name: "Fringe Trim" },
                  { id: "fabric-stud-gem-setters", name: "Fabric Stud & Gem Setters" },
                  { id: "braids-cords", name: "Braids & Cords" },
                  { id: "bias-tape", name: "Bias Tape" },
                  { id: "beaded-trim", name: "Beaded Trim" },
                  { id: "appliques-decorative-patches", name: "Appliques & Decorative Patches" },
                ],
              },
              { id: "thread-floss", name: "Thread & Floss" },
              { id: "storage-furniture", name: "Storage & Furniture" },
              { id: "sewing-project-kits", name: "Sewing Project Kits" },
              { id: "sewing-patterns-templates", name: "Sewing Patterns & Templates" },
              {
                id: "sewing-notions-supplies",
                name: "Sewing Notions & Supplies",
                children: [
                  { id: "tapes-adhesives", name: "Tapes & Adhesives" },
                  { id: "tape-measures-rulers", name: "Tape Measures & Rulers" },
                  { id: "sewing-tool-repair-kits", name: "Sewing Tool & Repair Kits" },
                  { id: "other-sewing-supplies", name: "Other Sewing Supplies" },
                  { id: "scissors", name: "Scissors" },
                  { id: "pinking-shears", name: "Pinking Shears" },
                  { id: "marking-tracing-tools", name: "Marking & Tracing Tools" },
                  { id: "pins-pincushions", name: "Pins & Pincushions" },
                  { id: "pillow-forms-foam", name: "Pillow Forms & Foam" },
                  { id: "machine-needles", name: "Machine Needles" },
                  { id: "heat-transfer-film-paper", name: "Heat Transfer Film & Paper" },
                  { id: "hand-sewing-needles", name: "Hand Sewing Needles" },
                  { id: "zippers", name: "Zippers" },
                  { id: "undergarment-sewing", name: "Undergarment Sewing" },
                  { id: "interlocking-tape", name: "Interlocking Tape" },
                  { id: "eyelets-grommets", name: "Eyelets & Grommets" },
                  { id: "cord-locks", name: "Cord Locks" },
                  { id: "clasps", name: "Clasps" },
                  { id: "buttons", name: "Buttons" },
                  { id: "buckles", name: "Buckles" },
                  { id: "elastic", name: "Elastic" },
                  { id: "bobbins", name: "Bobbins" },
                ],
              },
              { id: "embroidery-machine-designs-accessories", name: "Embroidery Machine Designs & Accessories" },
              { id: "sewing-machine-parts-accessories", name: "Sewing Machine Parts & Accessories" },
              { id: "sergers-overlock-machines", name: "Sergers & Overlock Machines" },
              { id: "serger-overlock-accessories", name: "Serger & Overlock Machine Accessories" },
              { id: "quilting", name: "Quilting" },
              {
                id: "industrial-machines",
                name: "Industrial Machines",
                children: [
                  { id: "industrial-sewing-machines", name: "Industrial Sewing Machines" },
                  { id: "industrial-serger-overlock-machines", name: "Industrial Serger & Overlock Machines" },
                  { id: "industrial-embroidery-machines", name: "Industrial Embroidery Machines" },
                ],
              },
              { id: "embroidery-machines", name: "Embroidery Machines" },
              { id: "sewing-machines", name: "Sewing Machines" },
            ],
          },
        ],
      },
      {
        id: "patio-lawn-garden",
        name: "Patio, Lawn & Garden",
        children: [
          {
            id: "pools-hot-tubs-supplies",
            name: "Pools, Hot Tubs & Supplies",
            children: [
              { id: "swimming-pools", name: "Swimming Pools" },
              { id: "saunas", name: "Saunas" },
              { id: "pumps", name: "Pumps" },
              { id: "parts-accessories", name: "Parts & Accessories" },
              { id: "hot-tubs", name: "Hot Tubs" },
              { id: "heaters-accessories", name: "Heaters & Accessories" },
              { id: "filters-filter-media", name: "Filters & Filter Media" },
              { id: "cleaning-tools-chemicals", name: "Cleaning Tools & Chemicals" },
            ],
          },
          {
            id: "pest-control",
            name: "Pest Control",
            children: [
              { id: "traps", name: "Traps" },
              { id: "sprayers", name: "Sprayers" },
              { id: "repellents", name: "Repellents" },
              { id: "foggers", name: "Foggers" },
              { id: "fly-swatters", name: "Fly Swatters" },
              { id: "bug-zappers", name: "Bug Zappers" },
              { id: "beneficial-insects", name: "Beneficial Insects" },
              { id: "baits-lures", name: "Baits & Lures" },
              { id: "pest-control-accessories", name: "Accessories" },
            ],
          },
          {
            id: "patio-furniture-accessories",
            name: "Patio Furniture & Accessories",
          },
          {
            id: "outdoor-power-tools",
            name: "Outdoor Power Tools",
          },
          {
            id: "outdoor-lighting",
            name: "Outdoor Lighting",
          },
          {
            id: "outdoor-heating-cooling",
            name: "Outdoor Heating & Cooling",
          },
          {
            id: "outdoor-decor",
            name: "Outdoor Décor",
          },
          {
            id: "grills-outdoor-cooking",
            name: "Grills & Outdoor Cooking",
            children: [
              { id: "barbecue-grill", name: "Barbecue Grill" },
              { id: "fuel-firestarters", name: "Fuel & Firestarters" },
            ],
          },
          {
            id: "gardening-lawn-care",
            name: "Gardening & Lawn Care",
          },
          {
            id: "farm-ranch",
            name: "Farm & Ranch",
          },
        ],
      },
      { id: "pet-supplies", name: "Pet Supplies" },
      { id: "tools-home-improvement", name: "Tools & Home Improvement" },
      { id: "wall-art", name: "Wall Art" },
      { id: "lighting", name: "Lighting" },
      { id: "event-party-supplies", name: "Event & Party Supplies" },
      { id: "cleaning-supplies", name: "Cleaning Supplies" },
      { id: "home-decor", name: "Home Decor" },
      { id: "furniture", name: "Furniture" },
      { id: "bath", name: "Bath" },
      { id: "storage-organization", name: "Storage & Organization" },
      { id: "bedding", name: "Bedding" },
      { id: "kitchen-dining", name: "Kitchen & Dining" },
    ],
  },
  {
    id: "electronics-appliances",
    name: "Electronics & Appliances",
    slug: "electronics-appliances",
    description: "TVs, audio, fridges, washing machines and more.",
    displayOrder: 2,
    tree: [
      { id: "security-surveillance", name: "Security & Surveillance" },
      { id: "camera-photo", name: "Camera & Photo" },
      { id: "generators-portable-power", name: "Generators & Portable Power" },
      { id: "portable-audio-video", name: "Portable Audio & Video" },
      { id: "home-audio", name: "Home Audio" },
      { id: "home-improvement-electronics", name: "Home Improvement" },
      { id: "heating-cooling-air-quality", name: "Heating, Cooling & Air Quality" },
      { id: "irons-steamers", name: "Irons & Steamers" },
      { id: "small-appliances", name: "Small Appliances" },
      { id: "television-video", name: "Television & Video" },
    ],
  },
  {
    id: "office-products",
    name: "Office Products",
    slug: "office-products",
    description: "Office supplies, desks, chairs and storage.",
    displayOrder: 3,
    tree: [
      { id: "office-furniture-lighting", name: "Office Furniture & Lighting" },
      { id: "office-electronics", name: "Office Electronics" },
      { id: "office-school-supplies", name: "Office & School Supplies" },
    ],
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    slug: "sports-outdoors",
    description: "Fitness, camping and outdoor essentials.",
    displayOrder: 4,
    tree: [
      { id: "sports-outdoor-equipment", name: "Sports & Outdoor Equipment" },
    ],
  },
  {
    id: "toys-games",
    name: "Toys & Games",
    slug: "toys-games",
    description: "Toys, puzzles and family games.",
    displayOrder: 5,
    tree: [
      { id: "tricycles", name: "Tricycles" },
      { id: "stuffed-animals-plush-toys", name: "Stuffed Animals & Plush Toys" },
      { id: "sports-outdoor-play", name: "Sports & Outdoor Play" },
      { id: "puppets-puppet-theaters", name: "Puppets & Puppet Theaters" },
      { id: "kids-furniture-decor-storage", name: "Kids' Furniture, Decor & Storage" },
      { id: "novelty-gag-toys", name: "Novelty & Gag Toys" },
      { id: "learning-education", name: "Learning & Education" },
      { id: "hobbies", name: "Hobbies" },
      { id: "games-puzzles", name: "Games & Puzzles" },
      { id: "dress-up-pretend-play-party-supplies", name: "Dress Up & Pretend Play & Party Supplies" },
      { id: "dolls-accessories", name: "Dolls & Accessories" },
      { id: "building-construction-toys", name: "Building & Construction Toys" },
      { id: "baby-toddler-toys", name: "Baby & Toddler Toys" },
      { id: "arts-crafts-toys", name: "Arts & Crafts" },
    ],
  },
  {
    id: "kids-baby-products",
    name: "Kids & Baby Products",
    slug: "kids-baby-products",
    description: "Baby care, kids toys and accessories.",
    displayOrder: 6,
    tree: [
      { id: "baby-clothes", name: "Baby Clothes" },
      { id: "baby-shoes", name: "Baby Shoes" },
      { id: "safety", name: "Safety" },
      { id: "baby-gifts", name: "Baby Gifts" },
      { id: "pregnancy-maternity", name: "Pregnancy & Maternity" },
      { id: "travel-gear", name: "Travel Gear" },
      { id: "potty-training", name: "Potty Training" },
      { id: "nursery", name: "Nursery" },
      { id: "feeding", name: "Feeding" },
      { id: "diapering", name: "Diapering" },
      { id: "baby-care", name: "Baby Care" },
    ],
  },
  {
    id: "shoes",
    name: "Shoes",
    slug: "shoes",
    description: "Footwear for all occasions.",
    displayOrder: 7,
    tree: [
      { id: "kids-baby-shoes", name: "Kids & Baby Shoes" },
      { id: "shoe-care-accessories", name: "Shoe Care & Accessories" },
      { id: "mens-shoes", name: "Men's Shoes" },
      { id: "womens-shoes", name: "Women's Shoes" },
    ],
  },
  {
    id: "phones-accessories",
    name: "Phones & Accessories",
    slug: "phones-accessories",
    description: "Smartphones, cases, chargers and more.",
    displayOrder: 8,
    tree: [
      { id: "ebook-readers-accessories", name: "Ebook Readers & Accessories" },
      { id: "mobile-accessories", name: "Mobile Accessories" },
      { id: "mobile-phones", name: "Mobile Phones" },
    ],
  },
  {
    id: "computers-accessories",
    name: "Computers & Accessories",
    slug: "computers-accessories",
    description: "Laptops, peripherals and computer accessories.",
    displayOrder: 9,
    tree: [
      { id: "video-games-accessories", name: "Video Games & Accessories" },
      { id: "computer-components", name: "Computer Components" },
      { id: "tablet-accessories", name: "Tablet Accessories" },
      { id: "laptop-accessories", name: "Laptop Accessories" },
      { id: "computer-accessories-peripherals", name: "Computer Accessories & Peripherals" },
      { id: "hard-drive-bags-cases", name: "Hard Drive Bags & Cases" },
      { id: "data-storage", name: "Data Storage" },
      { id: "networking-products", name: "Networking Products" },
      { id: "computers-tablets", name: "Computers & Tablets" },
    ],
  },
  {
    id: "bags",
    name: "Bags",
    slug: "bags",
    description: "Backpacks, handbags and travel bags.",
    displayOrder: 10,
    tree: [
      { id: "boys-bags", name: "Boy's Bags" },
      { id: "girls-bags", name: "Girl's Bags" },
      { id: "luggage-travel-gear", name: "Luggage & Travel Gear" },
      { id: "mens-bags", name: "Men's Bags" },
      { id: "womens-bags", name: "Women's Bags" },
    ],
  },
];

// Example products using a flexible attributes map.
// You can freely extend this list or change fields; the structure is future-proof.
const PRODUCTS: ProductSeed[] = [
  {
    id: "nonstick-cookware-set",
    categoryId: "home-kitchen",
    name: "Nonstick Cookware Set (5 Piece)",
    description: "Durable nonstick pots and pans set for everyday home cooking.",
    price: 3999,
    compareAtPrice: 4999,
    featured: true,
    isNew: true,
    inStock: true,
    rating: 4.7,
    images: [],
    attributes: {
      brand: "Generic",
      pieces: 5,
      material: "Aluminium, nonstick coating",
      color: "Black",
      suitableFor: "Gas & electric stoves",
    },
  },
  {
    id: "led-smart-tv-43",
    categoryId: "electronics-appliances",
    name: "43\" LED Smart TV",
    description: "Full HD smart TV with built-in Wi‑Fi and streaming apps.",
    price: 28999,
    compareAtPrice: 31999,
    featured: true,
    isNew: true,
    inStock: true,
    rating: 4.5,
    images: [],
    attributes: {
      brand: "Generic",
      screenSizeInches: 43,
      resolution: "1920x1080",
      smartPlatform: "Generic OS",
      hdmiPorts: 2,
      usbPorts: 1,
    },
  },
  {
    id: "office-desk-chair",
    categoryId: "office-products",
    name: "Ergonomic Office Desk Chair",
    description: "Adjustable ergonomic office chair with lumbar support.",
    price: 8999,
    compareAtPrice: 10499,
    featured: true,
    isNew: false,
    inStock: true,
    rating: 4.3,
    images: [],
    attributes: {
      color: "Black",
      material: "Mesh + metal base",
      maxWeightKg: 120,
      adjustableHeight: true,
      hasWheels: true,
    },
  },
  {
    id: "football-size-5",
    categoryId: "sports-outdoors",
    name: "Size 5 Training Football",
    description: "Durable size 5 football suitable for training and casual play.",
    price: 1999,
    compareAtPrice: 2499,
    featured: false,
    isNew: true,
    inStock: true,
    rating: 4.4,
    images: [],
    attributes: {
      size: 5,
      material: "PU",
      suitableSurface: "Grass & artificial turf",
    },
  },
  {
    id: "building-blocks-set",
    categoryId: "toys-games",
    name: "Building Blocks Set (100 pcs)",
    description: "Colorful building blocks set to inspire kids' creativity.",
    price: 1499,
    compareAtPrice: 1899,
    featured: true,
    isNew: true,
    inStock: true,
    rating: 4.8,
    images: [],
    attributes: {
      ageRange: "3+ years",
      pieces: 100,
      material: "Plastic",
    },
  },
  {
    id: "baby-stroller",
    categoryId: "kids-baby-products",
    name: "Foldable Baby Stroller",
    description: "Lightweight foldable stroller with safety harness.",
    price: 9999,
    compareAtPrice: 11999,
    featured: true,
    isNew: true,
    inStock: true,
    rating: 4.6,
    images: [],
    attributes: {
      suitableAge: "0–3 years",
      maxWeightKg: 15,
      color: "Gray",
      foldable: true,
    },
  },
  {
    id: "mens-running-shoes",
    categoryId: "shoes",
    name: "Men's Lightweight Running Shoes",
    description: "Breathable running shoes with cushioned sole.",
    price: 3999,
    compareAtPrice: 4599,
    featured: true,
    isNew: true,
    inStock: true,
    rating: 4.5,
    images: [],
    attributes: {
      gender: "Men",
      color: "Black/White",
      sizeRange: "40-45",
      upperMaterial: "Mesh",
      soleMaterial: "Rubber",
    },
  },
  {
    id: "smartphone-128gb",
    categoryId: "phones-accessories",
    name: "Smartphone 6.5\" 128GB",
    description: "6.5-inch smartphone with 128GB storage and dual cameras.",
    price: 24999,
    compareAtPrice: 27999,
    featured: true,
    isNew: true,
    inStock: true,
    rating: 4.4,
    images: [],
    attributes: {
      storageGb: 128,
      ramGb: 6,
      screenSizeInches: 6.5,
      batteryMah: 5000,
      sim: "Dual SIM",
    },
  },
  {
    id: "wireless-mouse",
    categoryId: "computers-accessories",
    name: "Wireless Optical Mouse",
    description: "2.4GHz wireless mouse with ergonomic design.",
    price: 899,
    compareAtPrice: 1199,
    featured: false,
    isNew: true,
    inStock: true,
    rating: 4.3,
    images: [],
    attributes: {
      connection: "2.4GHz USB receiver",
      dpi: 1600,
      batteryType: "AA",
      color: "Black",
    },
  },
  {
    id: "laptop-backpack-15-6",
    categoryId: "bags",
    name: "Laptop Backpack 15.6\"",
    description: "Water-resistant laptop backpack with padded compartment.",
    price: 2999,
    compareAtPrice: 3499,
    featured: true,
    isNew: true,
    inStock: true,
    rating: 4.6,
    images: [],
    attributes: {
      fitsLaptopInches: 15.6,
      material: "Polyester",
      color: "Black",
      waterResistant: true,
      compartments: 3,
    },
  },
];

async function seed() {
  const db = getDb();
  const now = FieldValue.serverTimestamp();

  console.log("Resetting Firestore data for new structure...");

  // 1. Clear existing data
  await clearCollection("products");
  await clearCollection("categories");

  // 2. Seed categories
  for (const cat of CATEGORIES) {
    await db.collection("categories").doc(cat.id).set(
      {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        displayOrder: cat.displayOrder,
        active: true,
        tree: cat.tree ?? [],
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  // 3. Seed products (flexible structure with attributes)
  for (const p of PRODUCTS) {
    await db.collection("products").doc(p.id).set(
      {
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        featured: p.featured ?? false,
        isNew: p.isNew ?? false,
        inStock: p.inStock ?? true,
        rating: p.rating ?? null,
        images: p.images ?? [],
        attributes: p.attributes ?? {},
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    );
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);

  console.log("Firestore reset and seeding completed.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});


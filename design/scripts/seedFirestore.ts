import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function getDb() {
  if (!getApps().length) {
    initializeApp(); // uses GOOGLE_APPLICATION_CREDENTIALS
  }
  return getFirestore();
}

const B2_BASE_URL =
  process.env.B2_BASE_URL || "https://YOUR_B2_BASE_URL/file/passmartshop-media";

if (B2_BASE_URL.includes("YOUR_B2_BASE_URL")) {
  throw new Error(
    "Please set B2_BASE_URL env var to your Backblaze base URL (e.g. https://f003.backblazeb2.com/file/passmartshop-media)."
  );
}

/** Maps categoryId to Backblaze B2 folder name (must match your actual upload structure) */
const CATEGORY_IMAGE_FOLDER: Record<string, string> = {
  "tools-equipment": "tools-equipment",
  "office-stationery": "office-stationery",
  "baby-kids": "baby-kids",
  "fashion-accessories": "fashion-accessories",
  "home-decor": "home-decor",
  "kitchen": "kitchen",
  "appliances": "appliances",
  "beauty-personal-care": "health-beauty", // Backblaze folder is health-beauty
  "electronics": "electronics",
  "outdoor-automotive": "outdoor-automotive",
  "home-living": "home-living",
};

/** Base path: products/{folder}/{slug}-main.png (folder from category) */
function productImageUrl(categoryId: string, slug: string) {
  const folder = CATEGORY_IMAGE_FOLDER[categoryId] ?? categoryId;
  const path = `products/${folder}/${slug}-main.png`;
  return `${B2_BASE_URL}/${path}`;
}

function categoryImageUrl(slug: string) {
  return `${B2_BASE_URL}/categories/${slug}.jpg`;
}

type CategorySeed = {
  id: string;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
};

type ProductSeed = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  tags: string[];
  price: number;
  compareAtPrice: number;
  sku: string;
  stockQuantity: number;
  featured: boolean;
  isNew: boolean;
  rating: number;
  seoTitle: string;
  seoDescription: string;
  /** true = "Local Stock" badge, false = "Ships from Overseas" (storefront) */
  localStock?: boolean;
  /** Optional: include for flash sale page/sections */
  flashSale?: boolean;
  flashSalePrice?: number;
  soldCount?: number;
};

const CATEGORIES: CategorySeed[] = [
  { id: "tools-equipment", name: "Tools & Equipment", slug: "tools-equipment", description: "Ladders, drills, spanners and essential tools.", displayOrder: 1 },
  { id: "office-stationery", name: "Office & Stationery", slug: "office-stationery", description: "Paper, staplers and desk organisers.", displayOrder: 2 },
  { id: "baby-kids", name: "Baby & Kids", slug: "baby-kids", description: "Feeding sets, walkers and toys for little ones.", displayOrder: 3 },
  { id: "fashion-accessories", name: "Fashion & Accessories", slug: "fashion-accessories", description: "Bags, belts and footwear.", displayOrder: 4 },
  { id: "home-decor", name: "Home & Decor", slug: "home-decor", description: "Decor, clocks, lights and festive items.", displayOrder: 5 },
  { id: "kitchen", name: "Kitchen", slug: "kitchen", description: "Cookware, cutlery and kitchen appliances.", displayOrder: 6 },
  { id: "appliances", name: "Appliances", slug: "appliances", description: "Vacuums, blenders and kettles.", displayOrder: 7 },
  { id: "beauty-personal-care", name: "Beauty & Personal Care", slug: "beauty-personal-care", description: "Skincare, makeup and grooming.", displayOrder: 8 },
  { id: "electronics", name: "Electronics", slug: "electronics", description: "Headphones, power banks and gadgets.", displayOrder: 9 },
  { id: "outdoor-automotive", name: "Outdoor & Automotive", slug: "outdoor-automotive", description: "Camping gear and car accessories.", displayOrder: 10 },
  { id: "home-living", name: "Home & Living", slug: "home-living", description: "Towels, pillows and home essentials.", displayOrder: 11 },
];

const PRODUCTS: ProductSeed[] = [
  // Tools & Equipment
  { id: "combination-spanner-set", categoryId: "tools-equipment", name: "Combination Spanner Set", slug: "combination-spanner-set", shortDescription: "Durable steel spanner set for household and workshop.", description: "High-quality combination spanner set in chrome vanadium steel. Ideal for DIY and car repairs.", tags: ["tools", "hand-tools"], price: 2599, compareAtPrice: 3299, sku: "TOOLS-01", stockQuantity: 30, featured: true, isNew: true, rating: 4.7, seoTitle: "Combination Spanner Set", seoDescription: "Durable spanner set for home and workshop.", localStock: true },
  { id: "cordless-drill", categoryId: "tools-equipment", name: "Cordless Drill Driver", slug: "cordless-drill", shortDescription: "Rechargeable cordless drill for drilling and screwdriving.", description: "Powerful cordless drill with variable speed and forward/reverse.", tags: ["tools", "power-tools"], price: 7499, compareAtPrice: 8999, sku: "TOOLS-02", stockQuantity: 18, featured: true, isNew: true, rating: 4.8, seoTitle: "Cordless Drill Driver", seoDescription: "Rechargeable cordless drill for DIY and professional use.", localStock: false },
  { id: "five-step-folding-ladder", categoryId: "tools-equipment", name: "5-Step Steel Folding Ladder", slug: "five-step-folding-ladder", shortDescription: "Stable 5-step steel folding ladder.", description: "Sturdy folding ladder with anti-slip steps and safety handle.", tags: ["ladder", "tools"], price: 6399, compareAtPrice: 7999, sku: "TOOLS-03", stockQuantity: 25, featured: true, isNew: true, rating: 4.6, seoTitle: "5-Step Folding Ladder", seoDescription: "Stable steel folding ladder for home and light commercial use." },
  // Office & Stationery
  { id: "a4-printing-paper-ream", categoryId: "office-stationery", name: "A4 Printing Paper Ream", slug: "a4-printing-paper-ream", shortDescription: "Eclipse A4 printing paper ream.", description: "Quality A4 printing paper for office and home use.", tags: ["office", "paper"], price: 899, compareAtPrice: 1099, sku: "OFF-01", stockQuantity: 100, featured: false, isNew: false, rating: 4.5, seoTitle: "A4 Printing Paper Ream", seoDescription: "A4 printing paper for office and home." },
  { id: "black-office-stapler", categoryId: "office-stationery", name: "Black Office Stapler", slug: "black-office-stapler", shortDescription: "Classic black office stapler.", description: "Reliable office stapler for everyday use.", tags: ["office", "stapler"], price: 499, compareAtPrice: 649, sku: "OFF-02", stockQuantity: 60, featured: false, isNew: true, rating: 4.4, seoTitle: "Black Office Stapler", seoDescription: "Classic office stapler." },
  { id: "desk-organizer-set", categoryId: "office-stationery", name: "Desk Organizer Set", slug: "desk-organizer-set", shortDescription: "Gray desk organizer for pens and supplies.", description: "Compact desk organizer to keep your workspace tidy.", tags: ["office", "organizer"], price: 1299, compareAtPrice: 1599, sku: "OFF-03", stockQuantity: 45, featured: true, isNew: true, rating: 4.6, seoTitle: "Desk Organizer Set", seoDescription: "Desk organizer for pens and office supplies." },
  // Baby & Kids
  { id: "baby-feeding-set", categoryId: "baby-kids", name: "Baby Feeding Set", slug: "baby-feeding-set", shortDescription: "Bowl, cup and spoon set for babies.", description: "Safe feeding set with bowl, cup and spoon for little ones.", tags: ["baby", "feeding"], price: 799, compareAtPrice: 999, sku: "BABY-01", stockQuantity: 40, featured: true, isNew: true, rating: 4.7, seoTitle: "Baby Feeding Set", seoDescription: "Baby feeding set with bowl, cup and spoon." },
  { id: "wooden-baby-walker", categoryId: "baby-kids", name: "Wooden Baby Walker", slug: "wooden-baby-walker", shortDescription: "Wooden baby walker with colourful blocks.", description: "Classic wooden baby walker with activity blocks.", tags: ["baby", "walker"], price: 2499, compareAtPrice: 2999, sku: "BABY-02", stockQuantity: 20, featured: true, isNew: true, rating: 4.8, seoTitle: "Wooden Baby Walker", seoDescription: "Wooden baby walker with blocks." },
  { id: "plush-teddy-bear", categoryId: "baby-kids", name: "Plush Teddy Bear", slug: "plush-teddy-bear", shortDescription: "Soft plush teddy bear.", description: "Cuddly plush teddy bear for kids.", tags: ["baby", "toys"], price: 599, compareAtPrice: 749, sku: "BABY-03", stockQuantity: 55, featured: false, isNew: false, rating: 4.5, seoTitle: "Plush Teddy Bear", seoDescription: "Soft plush teddy bear." },
  // Fashion & Accessories
  { id: "beige-ladies-handbag", categoryId: "fashion-accessories", name: "Beige Ladies Handbag", slug: "beige-ladies-handbag", shortDescription: "Elegant beige women's handbag.", description: "Stylish beige handbag for everyday use.", tags: ["fashion", "handbag"], price: 3499, compareAtPrice: 4299, sku: "FASH-01", stockQuantity: 25, featured: true, isNew: true, rating: 4.6, seoTitle: "Beige Ladies Handbag", seoDescription: "Elegant beige handbag." },
  { id: "brown-leather-belt", categoryId: "fashion-accessories", name: "Brown Leather Belt", slug: "brown-leather-belt", shortDescription: "Classic brown leather belt.", description: "Genuine leather belt in brown.", tags: ["fashion", "belt"], price: 1299, compareAtPrice: 1599, sku: "FASH-02", stockQuantity: 50, featured: false, isNew: false, rating: 4.4, seoTitle: "Brown Leather Belt", seoDescription: "Classic brown leather belt." },
  { id: "white-sneakers", categoryId: "fashion-accessories", name: "White Sneakers", slug: "white-sneakers", shortDescription: "Classic white sneakers.", description: "Comfortable white sneakers for casual wear.", tags: ["fashion", "footwear"], price: 2999, compareAtPrice: 3699, sku: "FASH-03", stockQuantity: 35, featured: true, isNew: true, rating: 4.7, seoTitle: "White Sneakers", seoDescription: "Classic white sneakers." },
  // Home & Decor
  { id: "christmas-baubles-set", categoryId: "home-decor", name: "Christmas Baubles Set", slug: "christmas-baubles-set", shortDescription: "Red and gold Christmas baubles.", description: "Festive Christmas baubles for tree decoration.", tags: ["decor", "christmas"], price: 899, compareAtPrice: 1099, sku: "DECOR-01", stockQuantity: 70, featured: true, isNew: true, rating: 4.5, seoTitle: "Christmas Baubles Set", seoDescription: "Christmas baubles for tree decoration." },
  { id: "christmas-wreath-decor", categoryId: "home-decor", name: "Christmas Wreath Decor", slug: "christmas-wreath-decor", shortDescription: "Festive wreath with berries and pinecones.", description: "Beautiful Christmas wreath for door or wall.", tags: ["decor", "christmas"], price: 1999, compareAtPrice: 2499, sku: "DECOR-02", stockQuantity: 30, featured: true, isNew: true, rating: 4.7, seoTitle: "Christmas Wreath Decor", seoDescription: "Festive Christmas wreath." },
  { id: "geometric-throw-pillow", categoryId: "home-decor", name: "Geometric Throw Pillow", slug: "geometric-throw-pillow", shortDescription: "Gray throw pillow with geometric pattern.", description: "Modern geometric throw pillow for sofa or bed.", tags: ["decor", "pillow"], price: 699, compareAtPrice: 899, sku: "DECOR-03", stockQuantity: 45, featured: false, isNew: false, rating: 4.4, seoTitle: "Geometric Throw Pillow", seoDescription: "Geometric throw pillow." },
  { id: "modern-wall-clock", categoryId: "home-decor", name: "Modern Wall Clock", slug: "modern-wall-clock", shortDescription: "Simple white modern wall clock.", description: "Minimalist wall clock with black numbers.", tags: ["decor", "clock"], price: 1499, compareAtPrice: 1899, sku: "DECOR-04", stockQuantity: 28, featured: true, isNew: true, rating: 4.6, seoTitle: "Modern Wall Clock", seoDescription: "Modern wall clock." },
  { id: "string-lights-in-jar", categoryId: "home-decor", name: "String Lights in Jar", slug: "string-lights-in-jar", shortDescription: "Warm white string lights in a jar.", description: "Decorative string lights in a clear jar.", tags: ["decor", "lights"], price: 999, compareAtPrice: 1299, sku: "DECOR-05", stockQuantity: 40, featured: false, isNew: true, rating: 4.5, seoTitle: "String Lights in Jar", seoDescription: "String lights in jar." },
  // Kitchen
  { id: "cutlery-set", categoryId: "kitchen", name: "Cutlery Set", slug: "cutlery-set", shortDescription: "Kitchen knives and forks in holder.", description: "Complete cutlery set with storage holder.", tags: ["kitchen", "cutlery"], price: 1899, compareAtPrice: 2299, sku: "KIT-01", stockQuantity: 35, featured: true, isNew: true, rating: 4.6, seoTitle: "Cutlery Set", seoDescription: "Kitchen cutlery set." },
  { id: "glass-jar-blender", categoryId: "kitchen", name: "Glass Jar Blender", slug: "glass-jar-blender", shortDescription: "White blender with glass jar.", description: "Powerful blender with glass jar for smoothies and more.", tags: ["kitchen", "blender"], price: 4499, compareAtPrice: 5499, sku: "KIT-02", stockQuantity: 22, featured: true, isNew: true, rating: 4.7, seoTitle: "Glass Jar Blender", seoDescription: "Blender with glass jar.", localStock: true, flashSale: true, flashSalePrice: 3999, soldCount: 120 },
  { id: "nonstick-cookware-set", categoryId: "kitchen", name: "Nonstick Cookware Set", slug: "nonstick-cookware-set", shortDescription: "Black nonstick pots and pans set.", description: "Complete nonstick cookware set for everyday cooking.", tags: ["kitchen", "cookware"], price: 3999, compareAtPrice: 4999, sku: "KIT-03", stockQuantity: 18, featured: true, isNew: true, rating: 4.8, seoTitle: "Nonstick Cookware Set", seoDescription: "Nonstick cookware set." },
  { id: "stainless-steel-cooking-pot", categoryId: "kitchen", name: "Stainless Steel Cooking Pot", slug: "stainless-steel-cooking-pot", shortDescription: "Stainless steel pot with lid.", description: "Durable stainless steel cooking pot.", tags: ["kitchen", "pot"], price: 2199, compareAtPrice: 2699, sku: "KIT-04", stockQuantity: 42, featured: false, isNew: false, rating: 4.5, seoTitle: "Stainless Steel Cooking Pot", seoDescription: "Stainless steel cooking pot." },
  // Appliances
  { id: "compact-floor-vacuum-cleaner", categoryId: "appliances", name: "Compact Floor Vacuum Cleaner", slug: "compact-floor-vacuum-cleaner", shortDescription: "Black and yellow compact floor vacuum.", description: "Powerful compact vacuum for floors and carpets.", tags: ["appliances", "vacuum"], price: 5999, compareAtPrice: 7499, sku: "APP-01", stockQuantity: 15, featured: true, isNew: true, rating: 4.7, seoTitle: "Compact Floor Vacuum", seoDescription: "Compact floor vacuum cleaner.", localStock: true },
  { id: "handheld-car-vacuum-cleaner", categoryId: "appliances", name: "Handheld Car Vacuum Cleaner", slug: "handheld-car-vacuum-cleaner", shortDescription: "Black handheld car vacuum.", description: "Portable vacuum for car interior cleaning.", tags: ["appliances", "vacuum"], price: 2499, compareAtPrice: 2999, sku: "APP-02", stockQuantity: 30, featured: true, isNew: true, rating: 4.6, seoTitle: "Handheld Car Vacuum", seoDescription: "Handheld car vacuum.", localStock: false },
  { id: "stainless-steel-electric-kettle", categoryId: "appliances", name: "Stainless Steel Electric Kettle", slug: "stainless-steel-electric-kettle", shortDescription: "Stainless steel electric kettle.", description: "Fast-boil electric kettle in stainless steel.", tags: ["appliances", "kettle"], price: 1799, compareAtPrice: 2199, sku: "APP-03", stockQuantity: 38, featured: false, isNew: false, rating: 4.5, seoTitle: "Stainless Steel Electric Kettle", seoDescription: "Electric kettle." },
  // Beauty & Personal Care
  { id: "electric-facial-cleansing-brush", categoryId: "beauty-personal-care", name: "Electric Facial Cleansing Brush", slug: "electric-facial-cleansing-brush", shortDescription: "Light blue electric cleansing brush.", description: "Gentle electric facial cleansing brush for skincare.", tags: ["beauty", "skincare"], price: 1999, compareAtPrice: 2499, sku: "BEAUTY-01", stockQuantity: 35, featured: true, isNew: true, rating: 4.6, seoTitle: "Electric Facial Cleansing Brush", seoDescription: "Electric facial cleansing brush." },
  { id: "makeup-brush-set", categoryId: "beauty-personal-care", name: "Makeup Brush Set", slug: "makeup-brush-set", shortDescription: "Pink-handled makeup brushes in holder.", description: "Complete makeup brush set for professional application.", tags: ["beauty", "makeup"], price: 1299, compareAtPrice: 1599, sku: "BEAUTY-02", stockQuantity: 50, featured: false, isNew: true, rating: 4.5, seoTitle: "Makeup Brush Set", seoDescription: "Makeup brush set." },
  { id: "skincare-serum-bottle", categoryId: "beauty-personal-care", name: "Skincare Serum Bottle", slug: "skincare-serum-bottle", shortDescription: "Amber serum bottle with dropper.", description: "Nourishing skincare serum with dropper applicator.", tags: ["beauty", "skincare"], price: 1499, compareAtPrice: 1899, sku: "BEAUTY-03", stockQuantity: 45, featured: true, isNew: true, rating: 4.7, seoTitle: "Skincare Serum Bottle", seoDescription: "Skincare serum with dropper." },
  // Electronics
  { id: "over-ear-headphones", categoryId: "electronics", name: "Over-Ear Headphones", slug: "over-ear-headphones", shortDescription: "Black over-ear headphones.", description: "Comfortable over-ear headphones for music and calls.", tags: ["electronics", "headphones"], price: 3499, compareAtPrice: 4299, sku: "ELEC-01", stockQuantity: 28, featured: true, isNew: true, rating: 4.7, seoTitle: "Over-Ear Headphones", seoDescription: "Over-ear headphones.", localStock: false, soldCount: 340 },
  { id: "slim-power-bank", categoryId: "electronics", name: "Slim Power Bank", slug: "slim-power-bank", shortDescription: "Black slim power bank.", description: "Portable power bank for charging on the go.", tags: ["electronics", "power-bank"], price: 1499, compareAtPrice: 1899, sku: "ELEC-02", stockQuantity: 55, featured: false, isNew: false, rating: 4.5, seoTitle: "Slim Power Bank", seoDescription: "Slim portable power bank.", localStock: true },
  // Outdoor & Automotive
  { id: "camping-led-lantern", categoryId: "outdoor-automotive", name: "Camping LED Lantern", slug: "camping-led-lantern", shortDescription: "Black and silver LED camping lantern.", description: "Bright LED lantern for camping and emergencies.", tags: ["outdoor", "camping"], price: 1299, compareAtPrice: 1599, sku: "OUT-01", stockQuantity: 40, featured: true, isNew: true, rating: 4.6, seoTitle: "Camping LED Lantern", seoDescription: "LED camping lantern." },
  { id: "car-seat-organizer", categoryId: "outdoor-automotive", name: "Car Seat Organizer", slug: "car-seat-organizer", shortDescription: "Brown leather car seat organizer.", description: "Hangs on car seat back for storage.", tags: ["automotive", "organizer"], price: 999, compareAtPrice: 1299, sku: "OUT-02", stockQuantity: 35, featured: false, isNew: true, rating: 4.4, seoTitle: "Car Seat Organizer", seoDescription: "Car seat back organizer." },
  // Home & Living
  { id: "folded-bath-towel", categoryId: "home-living", name: "Folded Bath Towel", slug: "folded-bath-towel", shortDescription: "Beige bath towel.", description: "Soft absorbent bath towel.", tags: ["home", "towel"], price: 799, compareAtPrice: 999, sku: "HOME-01", stockQuantity: 60, featured: false, isNew: false, rating: 4.5, seoTitle: "Folded Bath Towel", seoDescription: "Bath towel." },
  { id: "manual-water-pump-dispenser", categoryId: "home-living", name: "Manual Water Pump Dispenser", slug: "manual-water-pump-dispenser", shortDescription: "Green vintage-style water pump.", description: "Decorative manual water pump dispenser.", tags: ["home", "dispenser"], price: 1499, compareAtPrice: 1899, sku: "HOME-02", stockQuantity: 25, featured: true, isNew: true, rating: 4.6, seoTitle: "Manual Water Pump Dispenser", seoDescription: "Vintage water pump dispenser." },
];

async function seed() {
  const db = getDb();
  const now = FieldValue.serverTimestamp();

  for (const cat of CATEGORIES) {
    await db
      .collection("categories")
      .doc(cat.id)
      .set(
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: categoryImageUrl(cat.slug),
          displayOrder: cat.displayOrder,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
  }
  console.log(`Seeded ${CATEGORIES.length} categories.`);

  for (const p of PRODUCTS) {
    const primaryUrl = productImageUrl(p.categoryId, p.slug);
    const productData: Record<string, unknown> = {
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      shortDescription: p.shortDescription,
      description: p.description,
      tags: p.tags,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      currency: "KES",
      primaryImageUrl: primaryUrl,
      imageUrls: [primaryUrl],
      images: [primaryUrl],
      videoUrls: [],
      inStock: true,
      stockQuantity: p.stockQuantity,
      stockCount: String(p.stockQuantity),
      lowStockThreshold: 5,
      allowBackorder: false,
      featured: p.featured,
      isNew: p.isNew,
      rating: p.rating,
      reviewCount: 0,
      sku: p.sku,
      barcode: "",
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    if (p.localStock !== undefined) productData.localStock = p.localStock;
    if (p.flashSale === true) {
      productData.flashSale = true;
      if (p.flashSalePrice != null) productData.flashSalePrice = p.flashSalePrice;
    }
    if (p.soldCount != null) productData.soldCount = p.soldCount;
    await db.collection("products").doc(p.id).set(productData, { merge: true });
  }
  console.log(`Seeded ${PRODUCTS.length} products.`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

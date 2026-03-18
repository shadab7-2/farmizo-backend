const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const connectDB = require("../config/db");
const Product = require("../models/product.model");

const products = [
  // 🌿 INDOOR PLANTS
  {
    name: "Aloe Vera Plant",
    slug: "aloe-vera-plant",
    description: "Medicinal indoor plant easy to maintain",
    price: 299,
    category: "plants",
    type: "Indoor",
    stock: 50,
    images: ["https://images.unsplash.com/photo-1593697821028-7d6d3c4b6f29"],
    isActive: true,
  },
  {
    name: "Snake Plant",
    slug: "snake-plant",
    description: "Air purifying low maintenance plant",
    price: 349,
    category: "plants",
    type: "Indoor",
    stock: 60,
    images: ["https://source.unsplash.com/400x400/?snake-plant"],
    isActive: true,
  },
  {
    name: "Areca Palm",
    slug: "areca-palm",
    description: "Beautiful indoor palm for home decor",
    price: 499,
    category: "plants",
    type: "Indoor",
    stock: 40,
    images: ["https://source.unsplash.com/400x400/?areca-palm"],
    isActive: true,
  },
  {
    name: "Money Plant",
    slug: "money-plant",
    description: "Popular plant believed to bring prosperity",
    price: 199,
    category: "plants",
    type: "Indoor",
    stock: 70,
    images: ["https://source.unsplash.com/400x400/?money-plant"],
    isActive: true,
  },
  {
    name: "ZZ Plant",
    slug: "zz-plant",
    description: "Hardy plant perfect for low light",
    price: 399,
    category: "plants",
    type: "Indoor",
    stock: 35,
    images: ["https://source.unsplash.com/400x400/?zz-plant"],
    isActive: true,
  },
  {
    name: "Peace Lily",
    slug: "peace-lily",
    description: "Flowering indoor plant with air purification",
    price: 349,
    category: "plants",
    type: "Indoor",
    stock: 30,
    images: ["https://source.unsplash.com/400x400/?peace-lily"],
    isActive: true,
  },
  {
    name: "Rubber Plant",
    slug: "rubber-plant",
    description: "Stylish plant with glossy leaves",
    price: 399,
    category: "plants",
    type: "Indoor",
    stock: 30,
    images: ["https://source.unsplash.com/400x400/?rubber-plant"],
    isActive: true,
  },
  {
    name: "Spider Plant",
    slug: "spider-plant",
    description: "Easy growing indoor plant",
    price: 249,
    category: "plants",
    type: "Indoor",
    stock: 50,
    images: ["https://source.unsplash.com/400x400/?spider-plant"],
    isActive: true,
  },

  // 🌱 HERBS
  {
    name: "Tulsi Plant",
    slug: "tulsi-plant",
    description: "Sacred medicinal plant",
    price: 149,
    category: "plants",
    type: "Herbal",
    stock: 80,
    images: ["https://source.unsplash.com/400x400/?tulsi"],
    isActive: true,
  },
  {
    name: "Mint Plant",
    slug: "mint-plant",
    description: "Fresh herb for kitchen use",
    price: 99,
    category: "plants",
    type: "Herbal",
    stock: 90,
    images: ["https://source.unsplash.com/400x400/?mint"],
    isActive: true,
  },
  {
    name: "Coriander Plant",
    slug: "coriander-plant",
    description: "Daily cooking herb",
    price: 99,
    category: "plants",
    type: "Herbal",
    stock: 70,
    images: ["https://source.unsplash.com/400x400/?coriander"],
    isActive: true,
  },
  {
    name: "Lemongrass Plant",
    slug: "lemongrass-plant",
    description: "Aromatic herb for tea",
    price: 149,
    category: "plants",
    type: "Herbal",
    stock: 60,
    images: ["https://source.unsplash.com/400x400/?lemongrass"],
    isActive: true,
  },

  // 🌸 FLOWERING
  {
    name: "Rose Plant",
    slug: "rose-plant",
    description: "Classic garden flowering plant",
    price: 199,
    category: "plants",
    type: "Flowering",
    stock: 50,
    images: ["https://source.unsplash.com/400x400/?rose"],
    isActive: true,
  },
  {
    name: "Hibiscus Plant",
    slug: "hibiscus-plant",
    description: "Bright tropical flowers",
    price: 249,
    category: "plants",
    type: "Flowering",
    stock: 40,
    images: ["https://source.unsplash.com/400x400/?hibiscus"],
    isActive: true,
  },

  // 🌵 SUCCULENTS
  {
    name: "Jade Plant",
    slug: "jade-plant",
    description: "Symbol of good luck",
    price: 249,
    category: "plants",
    type: "Succulent",
    stock: 40,
    images: ["https://source.unsplash.com/400x400/?jade-plant"],
    isActive: true,
  },
  {
    name: "Echeveria",
    slug: "echeveria",
    description: "Compact decorative succulent",
    price: 199,
    category: "plants",
    type: "Succulent",
    stock: 60,
    images: ["https://source.unsplash.com/400x400/?succulent"],
    isActive: true,
  },
  {
    name: "Haworthia",
    slug: "haworthia",
    description: "Low maintenance mini succulent",
    price: 199,
    category: "plants",
    type: "Succulent",
    stock: 50,
    images: ["https://source.unsplash.com/400x400/?haworthia"],
    isActive: true,
  },

  // 🌿 PREMIUM
  {
    name: "Monstera Deliciosa",
    slug: "monstera-deliciosa",
    description: "Trendy designer plant",
    price: 799,
    category: "plants",
    type: "Premium",
    stock: 20,
    images: ["https://source.unsplash.com/400x400/?monstera"],
    isActive: true,
  },
  {
    name: "Fiddle Leaf Fig",
    slug: "fiddle-leaf-fig",
    description: "Luxury indoor decor plant",
    price: 999,
    category: "plants",
    type: "Premium",
    stock: 15,
    images: ["https://source.unsplash.com/400x400/?fiddle-leaf"],
    isActive: true,
  },

  // 🛠 TOOLS
  {
    name: "Garden Hand Trowel",
    slug: "hand-trowel",
    description: "Strong steel gardening tool",
    price: 149,
    category: "tools",
    type: "Hand Tools",
    stock: 70,
    images: ["https://images.unsplash.com/photo-1586864387789-628af9c1f6c1"],
    isActive: true,
  },
  {
    name: "Watering Can",
    slug: "watering-can",
    description: "Durable watering tool",
    price: 249,
    category: "tools",
    type: "Watering",
    stock: 60,
    images: ["https://source.unsplash.com/400x400/?watering-can"],
    isActive: true,
  },
  {
    name: "Pruning Shears",
    slug: "pruning-shears",
    description: "Sharp cutting tool",
    price: 199,
    category: "tools",
    type: "Cutting",
    stock: 50,
    images: ["https://source.unsplash.com/400x400/?garden-scissors"],
    isActive: true,
  },
  {
    name: "Spray Bottle",
    slug: "spray-bottle",
    description: "Mist spray for indoor plants",
    price: 149,
    category: "tools",
    type: "Watering",
    stock: 70,
    images: ["https://source.unsplash.com/400x400/?spray-bottle"],
    isActive: true,
  }
];

// const products = [
//   // PLANTS
//   {
//     name: "Aloe Vera Plant",
//     slug: "aloe-vera-plant",
//     description: "Medicinal indoor plant easy to maintain",
//     price: 299,
//     category: "plants",
//     type: "Indoor",
//     stock: 50,
//     images: [
//       "https://images.unsplash.com/photo-1593697821028-7d6d3c4b6f29",
//     ],
//     isActive: true,
//   },
//   {
//     name: "Rose Plant",
//     slug: "rose-plant",
//     description: "Beautiful flowering outdoor plant",
//     price: 349,
//     category: "plants",
//     type: "Outdoor",
//     stock: 40,
//     images: [
//       "https://images.unsplash.com/photo-1490750967868-88aa4486c946",
//     ],
//     isActive: true,
//   },

//   // SEEDS
//   {
//     name: "Tomato Seeds Pack",
//     slug: "tomato-seeds",
//     description: "High germination hybrid seeds",
//     price: 99,
//     category: "seeds",
//     type: "Vegetable",
//     stock: 100,
//     images: [
//       "https://images.unsplash.com/photo-1582515073490-dc84c7b44e45",
//     ],
//     isActive: true,
//   },

//   // FERTILIZERS
//   {
//     name: "Organic Vermicompost",
//     slug: "organic-vermicompost",
//     description: "Improves soil fertility naturally",
//     price: 249,
//     category: "fertilizers",
//     type: "Organic",
//     stock: 80,
//     images: [
//       "https://images.unsplash.com/photo-1615486363566-3fdf4a1d0f2f",
//     ],
//     isActive: true,
//   },

//   // AGRI PRODUCTS
//   {
//     name: "Neem Oil Pesticide",
//     slug: "neem-oil",
//     description: "Natural pest control solution",
//     price: 199,
//     category: "agriproducts",
//     type: "Pesticide",
//     stock: 60,
//     images: [
//       "https://images.unsplash.com/photo-1625246333195-78d9c38ad449",
//     ],
//     isActive: true,
//   },

//   // POTS
//   {
//     name: "Ceramic Plant Pot",
//     slug: "ceramic-pot",
//     description: "Premium decorative pot",
//     price: 399,
//     category: "pots",
//     type: "Ceramic",
//     stock: 35,
//     images: [
//       "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
//     ],
//     isActive: true,
//   },

//   // TOOLS
//   {
//     name: "Garden Hand Trowel",
//     slug: "hand-trowel",
//     description: "Strong steel gardening tool",
//     price: 149,
//     category: "tools",
//     type: "Hand Tools",
//     stock: 70,
//     images: [
//       "https://images.unsplash.com/photo-1586864387789-628af9c1f6c1",
//     ],
//     isActive: true,
//   },
// ];

const seedProducts = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding products...");

    await Product.deleteMany();
    await Product.insertMany(products);

    console.log("✅ Products seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seedProducts();

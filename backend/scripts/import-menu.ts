import { PrismaClient, Role, TableStatus } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const csvPath = path.join(__dirname, "../../menu.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("menu.csv not found at:", csvPath);
    return;
  }

  const csvData = fs.readFileSync(csvPath, "utf-8");
  const lines = csvData.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  // Skip the header
  const header = lines[0];
  const menuLines = lines.slice(1);

  console.log(`Found ${menuLines.length} menu items in CSV. Cleaning existing products and categories...`);

  // Clear existing orders, reservations, order items first to avoid relation violations
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Keep track of categories we create
  const categoryMap = new Map<string, string>();
  let categorySortOrder = 1;

  for (const line of menuLines) {
    // Basic CSV splitting, assumes no nested commas in quotes
    const parts = line.split(",");
    if (parts.length < 4) continue;

    const rawCategory = parts[0].trim();
    const rawName = parts[1].trim();
    const rawVariant = parts[2].trim();
    const rawPrice = parts[3].trim();

    // 1. Process Category
    let categoryId = categoryMap.get(rawCategory);
    if (!categoryId) {
      const newCat = await prisma.category.create({
        data: {
          name: rawCategory,
          sortOrder: categorySortOrder++,
        },
      });
      categoryId = newCat.id;
      categoryMap.set(rawCategory, categoryId);
      console.log(`Created Category: ${rawCategory}`);
    }

    // 2. Process Name & Variant
    // Combine name and variant. If variant is empty, just use name.
    const finalName = rawVariant ? `${rawName} (${rawVariant})` : rawName;

    // 3. Process Price
    // Handle price format like "38K" or "105K" or plain numbers
    let priceNum = 0;
    if (rawPrice.toUpperCase().endsWith("K")) {
      const val = parseFloat(rawPrice.slice(0, -1));
      priceNum = val * 1000;
    } else {
      priceNum = parseFloat(rawPrice) || 0;
    }

    // 4. Determine Temp Detail
    const tempDetail = rawVariant.toUpperCase() === "COLD" ? "COLD" : "HOT";

    // 5. Create Product
    // Default placeholder images matching names
    let placeholderImage = "/images/gundaling_milk.png";
    const lowerName = finalName.toLowerCase();
    if (lowerName.includes("latte") || lowerName.includes("coffee") || lowerName.includes("cappuccino") || lowerName.includes("espresso")) {
      placeholderImage = "/uploads/single_origin_latte.png";
    } else if (lowerName.includes("tea")) {
      placeholderImage = "/uploads/single_origin_latte.png";
    } else if (lowerName.includes("gelato") || lowerName.includes("dessert") || lowerName.includes("cake") || lowerName.includes("ice cream")) {
      placeholderImage = "/uploads/strawberry_gelato.png";
    } else if (lowerName.includes("salad")) {
      placeholderImage = "/uploads/heirloom_tomato_salad.png";
    } else if (lowerName.includes("salmon") || lowerName.includes("fish")) {
      placeholderImage = "/uploads/crispy_skin_salmon.png";
    } else if (lowerName.includes("pasta") || lowerName.includes("tagliatelle") || lowerName.includes("spaghetti")) {
      placeholderImage = "/uploads/truffle_tagliatelle.png";
    }

    await prisma.product.create({
      data: {
        name: finalName,
        price: priceNum,
        categoryId: categoryId,
        image: placeholderImage,
        desc: `${finalName} prepared fresh with premium farmstead ingredients.`,
        badge: rawVariant ? rawVariant.toUpperCase() : "FRESH",
        outOfStock: false,
        details: { temp: tempDetail, time: "10 min", calories: "350 kcal" },
        standards: {
          organicCert: true,
          tempControlled: true,
          allergenWarning: false,
          garnishAdded: false,
        },
      },
    });
  }

  console.log("Menu CSV successfully imported into the database.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

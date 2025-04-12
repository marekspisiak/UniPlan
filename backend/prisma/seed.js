import prisma from "./client.js";

const categories = [
  { name: "WORKSHOP", label: "Workshop", icon: "🧪" },
  { name: "LECTURE", label: "Prednáška", icon: "📚" },
  { name: "MEETUP", label: "Stretnutie", icon: "👥" },
  { name: "SOCIAL", label: "Voľnočasové", icon: "🎉" },
  { name: "ONLINE", label: "Online", icon: "💻" },
];

const seed = async () => {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("✅ Kategórie seeded");
  process.exit();
};

seed();

import prisma from "./client.js";

const categories = [
  { name: "WORKSHOP", label: "Workshop", icon: "🧪" },
  { name: "LECTURE", label: "Prednáška", icon: "📚" },
  { name: "MEETUP", label: "Stretnutie", icon: "👥" },
  { name: "SOCIAL", label: "Voľnočasové", icon: "🎉" },
  { name: "ONLINE", label: "Online", icon: "💻" },
  { name: "SPORT", label: "Šport", icon: "🏃‍♂️" },
  { name: "GAME_NIGHT", label: "Herný večer", icon: "🎮" },
  { name: "MUSIC", label: "Hudba / Koncert", icon: "🎵" },
  { name: "ART", label: "Umenie / Tvorba", icon: "🎨" },
  { name: "LANGUAGE", label: "Jazykové stretnutie", icon: "🗣️" },
  { name: "NETWORKING", label: "Networking", icon: "🤝" },
  { name: "FOOD", label: "Jedlo / Pochúťky", icon: "🍕" },
  { name: "MOVIE", label: "Film / Premietanie", icon: "🎬" },
  { name: "BOARDGAMES", label: "Stolové hry", icon: "🎲" },
  { name: "HACKATHON", label: "Hackathon", icon: "🧠" },
  { name: "TRIP", label: "Výlet", icon: "🧳" },
  { name: "FITNESS", label: "Fitness", icon: "🏋️‍♂️" },
  { name: "YOGA", label: "Jóga / Relax", icon: "🧘" },
  { name: "CHARITY", label: "Dobrovoľníctvo", icon: "❤️" },
  { name: "TECH", label: "Technológie", icon: "🖥️" },
  { name: "SCIENCE", label: "Veda", icon: "🔬" },
  { name: "NATURE", label: "Príroda", icon: "🌿" },
  { name: "READING", label: "Čítanie", icon: "📖" },
  { name: "DEBATE", label: "Diskusia / Debata", icon: "💬" },
  { name: "DANCE", label: "Tancovanie", icon: "💃" },
  { name: "PHOTO", label: "Fotografovanie", icon: "📷" },
  { name: "CULTURE", label: "Kultúra", icon: "🏛️" },
  { name: "CELEBRATION", label: "Oslava / Výročie", icon: "🥳" },
];

const seed = async () => {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("✅ Všetky kategórie boli vložené");
  process.exit();
};

seed();

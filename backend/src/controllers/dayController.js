import prisma from "../../prisma/client.js"; // alebo tvoje pripojenie

export const getAllDays = async (req, res) => {
  try {
    const days = await prisma.day.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json(days);
  } catch (err) {
    console.error("Chyba pri načítaní dní:", err);
    res.status(500).json({ message: "Server error" });
  }
};

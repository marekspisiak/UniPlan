import prisma from "../../prisma/client.js"; // alebo tvoje pripojenie

export const getAllDays = async (req, res) => {
  try {
    const days = await prisma.day.findMany({
      orderBy: { id: "asc" },
    });
    res.status(200).json(days);
  } catch (err) {
    return res.status(400).json({ message: "Nepodarilo sa načítať dni" });
  }
};

export async function joinRoom(tx, roomId, userId) {
  return tx.roomMember.upsert({
    where: {
      roomId_userId: {
        roomId,
        userId,
      },
    },
    create: {
      roomId,
      userId,
    },
    update: {},
  });
}

export async function leaveRoom(tx, roomId, userId) {
  return tx.roomMember.deleteMany({
    where: {
      roomId,
      userId,
    },
  });
}

export async function createRoom(tx, roomData) {
  return tx.room.create({
    data: roomData,
  });
}

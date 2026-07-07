import api from "./api";

// =========================
// GET ALL ROOMS
// =========================
export const getRooms = async () => {
  const response = await api.get("/rooms");
  return response.data;
};

// =========================
// GET ROOM BY ID
// =========================
export const getRoomById = async (id) => {
  const response = await api.get(`/rooms/${id}`);
  return response.data;
};

// =========================
// CREATE ROOM
// =========================
export const createRoom = async (roomData) => {
  const response = await api.post("/rooms", roomData);
  return response.data;
};

// =========================
// UPDATE ROOM
// =========================
export const updateRoom = async (id, roomData) => {
  const response = await api.put(`/rooms/${id}`, roomData);
  return response.data;
};

// =========================
// DELETE ROOM
// =========================
export const deleteRoom = async (id) => {
  const response = await api.delete(`/rooms/${id}`);
  return response.data;
};
import api from "./api";

// =========================
// GET ALL USERS
// =========================
export const getUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};

// =========================
// GET USER BY ID
// =========================
export const getUserById = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// =========================
// CREATE USER
// =========================
export const createUser = async (userData) => {
  const response = await api.post("/users", userData);
  return response.data;
};

// =========================
// UPDATE USER
// =========================
export const updateUser = async (id, userData) => {
  const response = await api.put(`/users/${id}`, userData);
  return response.data;
};

// =========================
// DELETE USER
// =========================
export const deleteUser = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};
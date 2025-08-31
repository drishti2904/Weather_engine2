import axios from "axios";

// Create Axios instance for backend API
const api = axios.create({
  baseURL: "http://localhost:5000/api/vessels", // change if backend runs on a different port
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// POST - Optimize Voyage
export const optimizeVoyage = async (voyageData) => {
  try {
    const response = await api.post("/optimize-voyage", voyageData);
    return response.data;
  } catch (error) {
    console.error("Error optimizing voyage:", error.response?.data || error.message);
    throw error;
  }
};

// GET - List vessels
export const getAvailableVessels = async () => {
  try {
    const response = await api.get("/list-vessels");
    return response.data;
  } catch (error) {
    console.error("Error fetching vessels:", error.response?.data || error.message);
    throw error;
  }
};

// GET - List routes
export const getAvailableRoutes = async () => {
  try {
    const response = await api.get("/list-routes");
    return response.data;
  } catch (error) {
    console.error("Error fetching routes:", error.response?.data || error.message);
    throw error;
  }
};

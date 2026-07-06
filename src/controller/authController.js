import authService from "../service/authService.js";
import dotenv from "dotenv";
dotenv.config();

const handleLogin = async (req, res) => {
  try {
    let data = await authService.handleLogin(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in handleLogin:", error);
    return res.status(500).json({
      EM: "Error from server login",
      EC: -1,
      DT: "",
    });
  }
};

const handleRegister = async (req, res) => {
  try {
    let data = await authService.handleRegister(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error in handleRegister:", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    let userID = req.headers["userid"];
    const data = await authService.changePassword(userID, req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Error changePassword:", error);
    return res.status(500).json({ EM: "Error from server", EC: -1, DT: "" });
  }
};

const updateProfile = async (req, res) => {
  try {
    let userID = req.headers["userid"];
    const data = await authService.updateProfile(userID, req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Error updateProfile:", error);
    return res.status(500).json({ EM: "Error from server", EC: -1, DT: "" });
  }
};

const getListUser = async (req, res) => {
  try {
    const data = await authService.getListUser(req.query);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Error getListUser:", error);
    return res.status(500).json({ EM: "Error from server", EC: -1, DT: "" });
  }
};

const createUser = async (req, res) => {
  try {
    const data = await authService.createUser(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Error createUser:", error);
    return res.status(500).json({ EM: "Error from server", EC: -1, DT: "" });
  }
};

const updateUser = async (req, res) => {
  try {
    const data = await authService.updateUser(req.body);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Error updateUser:", error);
    return res.status(500).json({ EM: "Error from server", EC: -1, DT: "" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const data = await authService.deleteUser(userId);
    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Error deleteUser:", error);
    return res.status(500).json({ EM: "Error from server", EC: -1, DT: "" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const data = await authService.resetPassword(req.body);

    return res.status(200).json(data);
  } catch (error) {
    console.error(">>> Error resetPassword:", error);
    return res.status(500).json({ EM: "Error from server", EC: -1, DT: "" });
  }
};

module.exports = {
  handleLogin,
  handleRegister,
  changePassword,
  updateProfile,
  getListUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};

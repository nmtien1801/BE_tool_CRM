require("dotenv").config();
import express from "express";
import configCORS from "./config/cors";
import cookieParser from "cookie-parser";
import http from "http";
const path = require("path");

// Routers
import authApi from "./router/authApi";
import customerApi from "./router/customerApi";

const app = express();

// ==========================================
// 2. CÁC CẤU HÌNH MIDDLEWARE & FILE TĨNH THÔNG THƯỜNG
// ==========================================
configCORS(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// 3. KHAI BÁO CÁC ROUTER HỆ THỐNG
// ==========================================
authApi(app);
customerApi(app);

// ==========================================
// 4. KHỜI CHẠY SERVER
// ==========================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

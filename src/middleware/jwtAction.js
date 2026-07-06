import dotenv from "dotenv";

dotenv.config();

// Mã khóa bí mật của Backend nhận diện (Khai báo trong file .env của BE)
const BACKEND_SECRET_KEY = process.env.API_SECRET_KEY;

const nonSecurePaths = [
  /^\/$/,
  /^\/auth\/login$/,
  /^\/auth\/logout$/,
  /^\/auth\/register$/,
  /^\/contact\/send$/,
  /^\/contact\/apply$/,
  /^\/recruitment\/list$/,
  /^\/recruitment\/byRecruitmentId\/[^/]+$/,
  /^\/post\/list$/,
  /^\/post\/byPostId\/[^/]+$/,
  /^\/product\/list$/,
  /^\/product\/dropdown$/,
  /^\/product\/byProductId\/[^/]+$/,
  /^\/product-category\/byCategory\/[^/]+$/,
  /^\/category\/list$/,
  /^\/category\/filter$/,
  /^\/product\/filter$/,
  /^\/file\/getFile/,
  /^\/product-image\/byProductId\/[^/]+$/,
  /^\/zalo-status$/,
  /^\/upload\/.*/,
  /^\/user-cut-video\/login$/,
];

// middleware kiểm tra API KEY thay thế cho JWT
const checkUserJwt = async (req, res, next) => {
  // Không kiểm tra các url nằm trong danh sách nonSecurePaths
  if (nonSecurePaths.some((pattern) => pattern.test(req.path))) {
    return next();
  }

  // Lấy chuỗi key xác thực gửi từ headers xuống
  const clientApiKey = req.headers["x-api-key"];
  const currentSecretKey = process.env.API_SECRET_KEY;

  if (clientApiKey && clientApiKey === currentSecretKey) {
    // Nếu key chính xác hoàn toàn, cho phép đi tiếp vào controller
    next();
  } else {
    // Trả ra lỗi 401 Unauthorized nếu không truyền key hoặc key sai
    return res.status(401).json({
      EC: -1,
      DT: "",
      EM: "Xác thực thất bại! Mã API Key không hợp lệ hoặc không tồn tại.",
    });
  }
};

// Giữ lại cấu trúc export cũ để tránh lỗi import ở các file định tuyến router
export { checkUserJwt };

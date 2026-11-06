import db from "../models/index.js";

const adminOnly = async (req, res, next) => {
  const userId = req.headers["userid"];
  if (!userId) {
    return res.status(401).json({ EC: -1, DT: "", EM: "Phiên đăng nhập không hợp lệ." });
  }

  const user = await db.User.findByPk(userId, { attributes: ["id", "role"] });
  if (!user || user.role !== "Admin") {
    return res.status(403).json({ EC: -1, DT: "", EM: "Chỉ Admin mới được truy cập chức năng này." });
  }
  return next();
};

export default adminOnly;

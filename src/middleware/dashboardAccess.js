import db from "../models/index.js";

const resolveUserId = (req) => {
  const rawId = req.user?.id || req.user?.userId || req.user?.sub || req.headers.userid;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const dashboardAccess = (roles) => async (req, res, next) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        EM: "Không xác định được người dùng.",
        EC: -1,
        DT: null,
      });
    }

    const user = await db.User.findByPk(userId, {
      attributes: ["id", "role", "cmicStudio", "cmicMedia"],
    });
    if (!user) {
      return res.status(401).json({
        EM: "Tài khoản không tồn tại.",
        EC: -1,
        DT: null,
      });
    }

    const role = String(user.role || "").trim().toLowerCase();
    if (!roles.includes(role)) {
      return res.status(403).json({
        EM: "Bạn không có quyền truy cập báo cáo này.",
        EC: -1,
        DT: null,
      });
    }

    req.dashboardUser = user;
    return next();
  } catch (error) {
    console.error("Error checking dashboard access:", error);
    return res.status(500).json({
      EM: "Không thể xác thực quyền truy cập dashboard.",
      EC: -1,
      DT: null,
    });
  }
};

export const businessDashboardAccess = dashboardAccess(["admin"]);
export const marketingDashboardAccess = dashboardAccess(["admin", "manager"]);

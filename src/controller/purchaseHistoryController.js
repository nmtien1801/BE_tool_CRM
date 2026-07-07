import db from "../models/index";
import crypto from "crypto";

// Hàm phụ trợ: Lấy họ tên thật (fullName) từ username hoặc id của nhân sự
const getStaffFullName = async (staffIdentifier) => {
  if (!staffIdentifier) return "";
  try {
    const staff = await db.User.findOne({
      where: {
        // Tìm kiếm linh hoạt, chấp nhận FE truyền lên id hoặc username của nhân viên
        [db.Sequelize.Op.or]: [
          { id: isNaN(staffIdentifier) ? -1 : Number(staffIdentifier) },
          { username: staffIdentifier },
        ],
      },
      attributes: ["fullName"],
    });
    return staff ? staff.fullName : staffIdentifier; // Nếu tìm thấy thì trả về tên thật, không thì giữ nguyên chuỗi gốc
  } catch (error) {
    console.error("Lỗi khi tìm tên nhân viên:", error);
    return staffIdentifier;
  }
};

// 1. GET: Lấy lịch sử mua hàng theo mã khách hàng truyền qua Query Params
const getPurchaseHistoryByCustomerId = async (req, res) => {
  try {
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({
        EM: "Thiếu tham số customerId bắt buộc!",
        EC: -1,
        DT: [],
      });
    }

    // Lấy danh sách lịch sử mua hàng (Lúc này consultant và careStaff đã là tên thật sẵn trong DB)
    const histories = await db.PurchaseHistory.findAll({
      where: { customerId: customerId },
      order: [["date", "DESC"]],
    });

    return res.status(200).json({
      EM: "Tải toàn bộ lịch sử giao dịch mua hàng thành công!",
      EC: 0,
      DT: histories,
    });
  } catch (error) {
    console.error("Lỗi getPurchaseHistoryByCustomerId BE:", error);
    return res.status(500).json({
      EM: "Lỗi máy chủ không thể đọc danh sách đơn hàng",
      EC: -1,
      DT: [],
    });
  }
};

// 2. POST: Tạo mới lịch sử mua hàng gắn với mã khách hàng truyền trong Body
const createPurchaseHistory = async (req, res) => {
  try {
    const {
      id,
      customerId,
      date,
      consultant,
      careStaff,
      behaviorMetric,
      isCared,
      ...historyData
    } = req.body;

    if (!customerId) {
      return res
        .status(400)
        .json({ EM: "Thiếu customerId!", EC: -1, DT: null });
    }

    // 🛡️ TỰ SINH CHUỖI ID DẠNG UUID
    const customId = crypto.randomUUID();

    let validDate = date;
    if (!date || date === "Invalid date" || isNaN(Date.parse(date))) {
      validDate = new Date();
    }

    // 🛠️ ĐÃ SỬA: Chuyển đổi ID/Username từ Frontend thành Họ và tên thật trước khi lưu
    const consultantName = await getStaffFullName(consultant);
    const careStaffName = await getStaffFullName(careStaff);

    const newHistory = await db.PurchaseHistory.create({
      ...historyData,
      id: customId,
      customerId,
      date: validDate,
      consultant: consultantName, // Lưu trực tiếp Họ và tên chữ
      careStaff: careStaffName, // Lưu trực tiếp Họ và tên chữ
      behaviorMetric: behaviorMetric ?? null,
      isCared: Boolean(isCared),
    });

    // Cập nhật lại tổng số lần mua hàng của khách hàng sau khi thêm đơn mới
    const purchaseCount = await db.PurchaseHistory.count({
      where: { customerId },
    });
    await db.Customer.update({ purchaseCount }, { where: { id: customerId } });

    return res
      .status(200)
      .json({ EM: "Thêm đơn thành công!", EC: 0, DT: newHistory });
  } catch (error) {
    console.error("Lỗi createPurchaseHistory BE:", error);
    return res.status(500).json({ EM: "Lỗi máy chủ", EC: -1, DT: null });
  }
};

// 3. PUT: Cập nhật chi tiết đơn mua hàng theo historyId nằm trên URL Params
const updatePurchaseHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    const { consultant, careStaff, behaviorMetric, isCared, ...updateData } =
      req.body;

    // Chuẩn bị object chứa các trường cần update công khai
    const payloadUpdate = { ...updateData };

    // 🛠️ ĐÃ SỬA: Nếu trong body chỉnh sửa có thay đổi nhân sự, cập nhật tên chữ mới
    if (consultant !== undefined) {
      payloadUpdate.consultant = await getStaffFullName(consultant);
    }
    if (careStaff !== undefined) {
      payloadUpdate.careStaff = await getStaffFullName(careStaff);
    }
    if (behaviorMetric !== undefined) {
      payloadUpdate.behaviorMetric = behaviorMetric;
    }
    if (isCared !== undefined) {
      payloadUpdate.isCared = Boolean(isCared);
    }

    await db.PurchaseHistory.update(payloadUpdate, {
      where: { id: historyId },
    });

    const history = await db.PurchaseHistory.findByPk(historyId);
    if (history) {
      const purchaseCount = await db.PurchaseHistory.count({
        where: { customerId: history.customerId },
      });
      await db.Customer.update(
        { purchaseCount },
        { where: { id: history.customerId } },
      );
    }

    return res.status(200).json({
      EM: "Cập nhật chi tiết đơn mua hàng thành công!",
      EC: 0,
      DT: "",
    });
  } catch (error) {
    console.error("Lỗi updatePurchaseHistory BE:", error);
    return res.status(500).json({
      EM: "Không thể chỉnh sửa lịch sử mua hàng",
      EC: -1,
      DT: null,
    });
  }
};

// 4. DELETE: Xóa bản ghi đơn mua hàng theo historyId nằm trên URL Params
const deletePurchaseHistory = async (req, res) => {
  try {
    const { historyId } = req.params;

    const history = await db.PurchaseHistory.findByPk(historyId);
    if (!history) {
      return res
        .status(404)
        .json({ EM: "Không tìm thấy đơn hàng cần xóa", EC: 1, DT: null });
    }

    await db.PurchaseHistory.destroy({
      where: { id: historyId },
    });

    const purchaseCount = await db.PurchaseHistory.count({
      where: { customerId: history.customerId },
    });
    await db.Customer.update(
      { purchaseCount },
      { where: { id: history.customerId } },
    );

    return res.status(200).json({
      EM: "Xóa bản ghi đơn mua hàng thành công!",
      EC: 0,
      DT: "",
    });
  } catch (error) {
    console.error("Lỗi deletePurchaseHistory BE:", error);
    return res.status(500).json({
      EM: "Không thể loại bỏ lịch sử mua hàng",
      EC: -1,
      DT: null,
    });
  }
};

export default {
  getPurchaseHistoryByCustomerId,
  createPurchaseHistory,
  updatePurchaseHistory,
  deletePurchaseHistory,
};

import db from "../models/index"; // Giả định dùng Sequelize ORM

const getAllCustomers = async (req, res) => {
  try {
    // Nhận diện các query params từ FE gửi sang để thực hiện phân trang server-side
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 5;
    const search = (req.query.search || "").trim();
    const searchById = (
      req.query.id ||
      req.query.customerId ||
      req.query.searchId ||
      ""
    )
      .toString()
      .trim();
    const label = (req.query.label || "").trim();
    const ecosystem = (req.query.ecosystem || "").trim();

    const offset = (page - 1) * pageSize;

    // Xây dựng điều kiện lọc dữ liệu
    const whereConditions = [];

    if (label) {
      whereConditions.push({ label });
    }
    if (ecosystem) {
      whereConditions.push({ ecosystem });
    }
    if (searchById) {
      const numericId = Number(searchById);
      whereConditions.push(
        Number.isNaN(numericId)
          ? { id: { [db.Sequelize.Op.like]: `%${searchById}%` } }
          : { id: numericId },
      );
    }
    if (search) {
      whereConditions.push({
        [db.Sequelize.Op.or]: [
          { fullName: { [db.Sequelize.Op.like]: `%${search}%` } },
          { phone: { [db.Sequelize.Op.like]: `%${search}%` } },
          { email: { [db.Sequelize.Op.like]: `%${search}%` } },
        ],
      });
    }

    const whereClause =
      whereConditions.length > 0
        ? whereConditions.length === 1
          ? whereConditions[0]
          : { [db.Sequelize.Op.and]: whereConditions }
        : {};

    // Thực hiện truy vấn đồng thời đếm tổng số lượng bản ghi thỏa điều kiện
    const { count, rows } = await db.Customer.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset: offset,
      order: [["id", "DESC"]],
    });

    const totalPages = Math.ceil(count / pageSize) || 1;

    // Trả về đúng định dạng chuẩn EM, EC, DT cho Frontend bóc tách
    return res.status(200).json({
      EM: "Tải danh sách khách hàng phân trang thành công!",
      EC: 0,
      DT: {
        items: rows, // Mảng danh sách chứa các object khách hàng
        total: count, // Tổng số dòng bản ghi gốc thỏa mãn bộ lọc
        totalPages: totalPages, // Tổng số lượng trang
      },
    });
  } catch (error) {
    console.error("Lỗi getAllCustomers BE:", error);
    return res.status(500).json({
      EM: "Lỗi máy chủ hệ thống không thể xử lý phân trang khách hàng",
      EC: -1,
      DT: null,
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await db.Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        EM: "Không tìm thấy thông tin khách hàng này!",
        EC: 1,
        DT: null,
      });
    }
    return res
      .status(200)
      .json({ EM: "Lấy chi tiết khách hàng thành công!", EC: 0, DT: customer });
  } catch (error) {
    return res.status(500).json({ EM: "Lỗi hệ thống", EC: -1, DT: null });
  }
};

const createCustomer = async (req, res) => {
  try {
    const newCustomer = await db.Customer.create(req.body);
    return res.status(200).json({
      EM: "Tạo mới tài khoản khách hàng thành công!",
      EC: 0,
      DT: newCustomer, // FE cần trường DT chứa object có ID vừa sinh ra để chạy bước kế tiếp
    });
  } catch (error) {
    return res
      .status(500)
      .json({ EM: "Lỗi khi tạo mới khách hàng", EC: -1, DT: null });
  }
};

const updateCustomer = async (req, res) => {
  try {
    await db.Customer.update(req.body, { where: { id: req.params.id } });
    return res.status(200).json({
      EM: "Cập nhật thông tin khách hàng hành chính thành công!",
      EC: 0,
      DT: "",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ EM: "Lỗi khi cập nhật dữ liệu khách hàng", EC: -1, DT: null });
  }
};

const getCustomerTotalSpent = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await db.Customer.findByPk(customerId);

    if (!customer) {
      return res
        .status(404)
        .json({ EM: "Không tìm thấy khách hàng này!", EC: 1, DT: null });
    }

    const totalSpent = await db.PurchaseHistory.sum("price", {
      where: { customerId },
    });

    return res.status(200).json({
      EM: "Tính tổng tiền mua hàng của khách hàng thành công!",
      EC: 0,
      DT: {
        customerId,
        totalSpent: totalSpent || 0,
      },
    });
  } catch (error) {
    console.error("Lỗi getCustomerTotalSpent BE:", error);
    return res.status(500).json({
      EM: "Lỗi hệ thống khi tính tổng tiền mua hàng",
      EC: -1,
      DT: null,
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    await db.Customer.destroy({ where: { id: req.params.id } });
    return res
      .status(200)
      .json({ EM: "Xóa thông tin khách hàng thành công!", EC: 0, DT: "" });
  } catch (error) {
    return res
      .status(500)
      .json({ EM: "Lỗi khi xóa khách hàng", EC: -1, DT: null });
  }
};

export default {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTotalSpent,
};

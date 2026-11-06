import db from "../models/index"; // Giả định dùng Sequelize ORM

const getAllCustomers = async (req, res) => {
  try {
    const viewerId = req.userId || req.user?.id || req.headers["userid"];
    const viewer = viewerId
      ? await db.User.findByPk(viewerId, {
          attributes: [
            "role",
            "fullName",
            "userName",
            "cmicMedia",
            "cmicStudio",
          ],
        })
      : null;
    if (!viewer) {
      return res
        .status(401)
        .json({ EM: "Không xác định được người dùng.", EC: -1, DT: null });
    }

    // DEBUG - remove after permission testing
    console.log("Customer viewer debug:", {
      viewerId,
      role: viewer.role,
      cmicMedia: viewer.cmicMedia,
      cmicStudio: viewer.cmicStudio,
    });

    const normalizedRole = String(viewer.role || "")
      .trim()
      .toLowerCase();
    const isAdmin = normalizedRole === "admin";
    const isManager = normalizedRole === "manager";
    const allowedEcosystems = [];

    if ((isManager || normalizedRole === "staff") && viewer) {
      if (viewer.cmicMedia) allowedEcosystems.push("CMIC_MEDIA");
      if (viewer.cmicStudio) allowedEcosystems.push("CMIC_STUDIO");
    }

    const staffNames = [viewer.fullName, viewer.userName]
      .filter((name) => String(name || "").trim())
      .map((name) => String(name).trim());
    const normalizedStaffNames = new Set(
      staffNames.map((name) => name.toLowerCase()),
    );

    const assignedHistories =
      !isAdmin && normalizedStaffNames.size > 0
        ? await db.PurchaseHistory.findAll({
            attributes: ["customerId", "careStaff", "seller", "consultant"],
          })
        : [];
    const assignedIds = [
      ...new Set(
        assignedHistories
          .filter((history) =>
            [history.careStaff, history.seller, history.consultant].some(
              (name) =>
                normalizedStaffNames.has(
                  String(name || "")
                    .trim()
                    .toLowerCase(),
                ),
            ),
          )
          .map((history) => history.customerId)
          .filter(Boolean),
      ),
    ];

    console.log("Customer assignedIds debug:", assignedIds.length);

    if (normalizedRole === "staff" && assignedIds.length === 0) {
      return res.status(200).json({
        EM: "Nhân viên chưa được phân công khách hàng.",
        EC: 0,
        DT: { items: [], total: 0, totalPages: 1 },
      });
    }

    if (isManager && allowedEcosystems.length === 0) {
      return res.status(200).json({
        EM: "Quản lý chưa được phân công hệ sinh thái.",
        EC: 0,
        DT: { items: [], total: 0, totalPages: 1 },
      });
    }

    if (
      !isAdmin &&
      allowedEcosystems.length === 0 &&
      assignedIds.length === 0
    ) {
      return res.status(200).json({
        EM: "Nhân viên chưa được phân công hệ sinh thái hoặc khách hàng.",
        EC: 0,
        DT: { items: [], total: 0, totalPages: 1 },
      });
    }

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
    const ecosystemsParam = (req.query.ecosystems || "").trim();
    const onlyAssigned =
      normalizedRole === "staff" || req.query.onlyAssigned === "true";

    const offset = (page - 1) * pageSize;

    // Xây dựng điều kiện lọc dữ liệu
    const whereConditions = [];

    if (label) {
      whereConditions.push({ label });
    }
    let requestedEcosystems = allowedEcosystems;
    if (ecosystem) {
      requestedEcosystems = [ecosystem.toUpperCase()].filter((item) =>
        allowedEcosystems.includes(item),
      );
    } else if (ecosystemsParam) {
      const clientEcosystems = ecosystemsParam
        .split(",")
        .map((item) => item.trim().toUpperCase());
      requestedEcosystems = allowedEcosystems.filter((item) =>
        clientEcosystems.includes(item),
      );
    }

    if (!isAdmin && onlyAssigned) {
      const validAssignedIds = assignedIds.length > 0 ? assignedIds : [0];
      whereConditions.push({ id: { [db.Sequelize.Op.in]: validAssignedIds } });
      if (ecosystem) {
        whereConditions.push({
          ecosystem: requestedEcosystems.includes(ecosystem.toUpperCase())
            ? ecosystem.toUpperCase()
            : "__NO_ACCESS__",
        });
      }
    } else if (!isAdmin) {
      const ecosystemCondition =
        requestedEcosystems.length > 0
          ? [{ ecosystem: { [db.Sequelize.Op.in]: requestedEcosystems } }]
          : [];
      const assignedCondition = isManager
        ? []
        : [
            {
              id: {
                [db.Sequelize.Op.in]:
                  assignedIds.length > 0 ? assignedIds : [0],
              },
            },
          ];
      if (ecosystemCondition.length > 0 || assignedCondition.length > 0) {
        whereConditions.push({
          [db.Sequelize.Op.or]: [...ecosystemCondition, ...assignedCondition],
        });
      } else {
        whereConditions.push({ ecosystem: "__NO_ACCESS__" });
      }
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
    const viewerId = req.userId || req.user?.id || req.headers["userid"];
    const viewer = viewerId
      ? await db.User.findByPk(viewerId, {
          attributes: [
            "role",
            "fullName",
            "userName",
            "cmicMedia",
            "cmicStudio",
          ],
        })
      : null;
    if (!viewer) {
      return res
        .status(401)
        .json({ EM: "Không xác định được người dùng.", EC: -1, DT: null });
    }

    const customer = await db.Customer.findByPk(req.params.id);
    if (!customer) {
      return res.status(404).json({
        EM: "Không tìm thấy thông tin khách hàng này!",
        EC: 1,
        DT: null,
      });
    }

    const normalizedRole = String(viewer.role || "")
      .trim()
      .toLowerCase();
    const isAdmin = normalizedRole === "admin";
    if (!isAdmin) {
      const ecosystem = String(customer.ecosystem || "").toUpperCase();
      const allowed =
        (viewer.cmicMedia && ecosystem === "CMIC_MEDIA") ||
        (viewer.cmicStudio && ecosystem === "CMIC_STUDIO");

      const staffNames = [viewer.fullName, viewer.userName]
        .filter((name) => String(name || "").trim())
        .map((name) => String(name).trim().toLowerCase());
      const assignedHistories = await db.PurchaseHistory.findAll({
        where: { customerId: customer.id },
        attributes: ["careStaff", "seller", "consultant"],
      });
      const assignedHistory = assignedHistories.find((history) =>
        [history.careStaff, history.seller, history.consultant].some((name) =>
          staffNames.includes(
            String(name || "")
              .trim()
              .toLowerCase(),
          ),
        ),
      );

      const isStaff = normalizedRole === "staff";
      const isManager = normalizedRole === "manager";
      const canView = isManager
        ? allowed
        : isStaff
          ? Boolean(assignedHistory)
          : false;
      if (!canView) {
        return res.status(403).json({
          EM: "Bạn không có quyền xem khách hàng thuộc hệ sinh thái này.",
          EC: -1,
          DT: null,
        });
      }
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

const searchCustomerByPhoneOrEmail = async (req, res) => {
  try {
    const phone = (req.query.phone || "").trim();
    const email = (req.query.email || "").trim();
    const ecosystem = (req.query.ecosystem || "").trim();

    // 1. Kiểm tra tham số đầu vào
    if (!phone && !email) {
      return res.status(400).json({
        EM: "Vui lòng cung cấp số điện thoại hoặc email để tìm kiếm!",
        EC: 1,
        DT: [],
      });
    }

    if (!ecosystem) {
      return res.status(400).json({
        EM: "Vui lòng cung cấp hệ sinh thái (ecosystem)!",
        EC: 1,
        DT: [],
      });
    }

    // 2. Xây dựng điều kiện: (phone = X OR email = Y)
    const orConditions = [];

    if (phone && phone !== "0") {
      orConditions.push({ phone: phone });
    }

    if (email) {
      orConditions.push({ email: email.toLowerCase() });
    }

    if (orConditions.length === 0) {
      return res.status(200).json({
        EM: "Không tìm thấy khách hàng phù hợp.",
        EC: 0,
        DT: [],
      });
    }

    // 3. Kết hợp điều kiện: [ (phone khớp OR email khớp) AND ecosystem khớp ]
    const customers = await db.Customer.findAll({
      where: {
        [db.Sequelize.Op.and]: [
          { [db.Sequelize.Op.or]: orConditions },
          { ecosystem: ecosystem.toUpperCase() }, // hoặc giữ nguyên ecosystem tùy DB lưu hoa/thường
        ],
      },
      order: [["id", "DESC"]],
      limit: 10,
    });

    return res.status(200).json({
      EM: "Tìm kiếm khách hàng thành công!",
      EC: 0,
      DT: customers,
    });
  } catch (error) {
    console.error("Lỗi searchCustomer BE:", error);
    return res.status(500).json({
      EM: "Lỗi hệ thống khi tìm kiếm khách hàng.",
      EC: -1,
      DT: null,
    });
  }
};

export default {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTotalSpent,
  searchCustomerByPhoneOrEmail,
};

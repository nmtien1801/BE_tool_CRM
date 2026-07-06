const CustomerService = require("../service/customerService");

const createCustomer = async (req, res) => {
  try {
    let data = await CustomerService.createCustomer(req.body);

    return res.status(200).json({
      EM: data?.EM || "Create customer success",
      EC: data?.EC || 0,
      DT: data?.DT || data,
    });
  } catch (error) {
    console.error("Error in createCustomer:", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    // Hỗ trợ nhận cả 'limit' hoặc 'size' từ Frontend gửi lên
    const limit = Math.max(
      parseInt(req.query.limit || req.query.size, 10) || 10,
      1,
    );
    const offset = (page - 1) * limit;

    const { label, ecosystem } = req.query;
    const filters = {};
    if (label) filters.label = label;
    if (ecosystem) filters.ecosystem = ecosystem;

    // Gọi xuống service lấy dữ liệu
    const result = await CustomerService.getAllCustomers(
      filters,
      limit,
      offset,
    );

    // Chuẩn bị data phân trang trả về cho DT
    const responseData = {
      rows: result?.rows || [],
      pagination: {
        totalItems: result?.count || 0,
        totalPages: Math.ceil((result?.count || 0) / limit),
        currentPage: page,
        pageSize: limit,
      },
    };

    return res.status(200).json({
      EM: "Get all customers success",
      EC: 0,
      DT: responseData,
    });
  } catch (error) {
    console.error("Error in getAllCustomers:", error); // Dòng này giúp bạn nhìn thấy lỗi 500 thực tế tại Terminal Backend
    return res.status(500).json({
      EM: "Error from server: " + error.message,
      EC: -1,
      DT: "",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    let data = await CustomerService.getCustomerById(req.params.id);

    if (!data) {
      return res.status(200).json({
        EM: "Customer not found",
        EC: 1,
        DT: "",
      });
    }

    return res.status(200).json({
      EM: "Get customer success",
      EC: 0,
      DT: data,
    });
  } catch (error) {
    console.error("Error in getCustomerById:", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    let data = await CustomerService.updateCustomer(req.params.id, req.body);

    return res.status(200).json({
      EM: "Update customer success",
      EC: 0,
      DT: data,
    });
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

const patchCustomer = async (req, res) => {
  try {
    let data = await CustomerService.updateCustomer(req.params.id, req.body);

    return res.status(200).json({
      EM: "Patch customer success",
      EC: 0,
      DT: data,
    });
  } catch (error) {
    console.error("Error in patchCustomer:", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

const deletePurchaseHistory = async (req, res) => {
  try {
    const { id, historyId } = req.params;
    let result = await CustomerService.deletePurchaseHistory(id, historyId);

    return res.status(200).json({
      EM: result?.EM || "Delete purchase history success",
      EC: result?.EC || 0,
      DT: result?.DT || "",
    });
  } catch (error) {
    console.error("Error in deletePurchaseHistory:", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    let result = await CustomerService.deleteCustomer(req.params.id);

    return res.status(200).json({
      EM: result?.EM || "Delete customer success",
      EC: result?.EC || 0,
      DT: result?.DT || "",
    });
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    return res.status(500).json({
      EM: "Error from server",
      EC: -1,
      DT: "",
    });
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  patchCustomer,
  deletePurchaseHistory,
  deleteCustomer,
};

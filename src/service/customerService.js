const { Customer, PurchaseHistory, sequelize } = require("../models");

const normalizeDate = (date) => {
  if (!date) return null;
  const value = String(date).trim();
  const dmyMatch = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return value;
};

// READ Single Customer (Hàm bổ trợ nội bộ và export)
const getCustomerById = async (id) => {
  const customer = await Customer.findByPk(id, {
    include: [{ model: PurchaseHistory, as: "purchaseHistories" }],
  });
  return customer;
};

// CREATE Customer kèm Lịch sử mua hàng ban đầu
const createCustomer = async (data) => {
  const transaction = await sequelize.transaction();
  try {
    const { purchaseHistories, ...customerData } = data;

    if (customerData.birthday) {
      customerData.birthday = normalizeDate(customerData.birthday);
    }

    const customer = await Customer.create(customerData, { transaction });

    if (purchaseHistories && purchaseHistories.length > 0) {
      const histories = purchaseHistories.map((history, index) => ({
        ...history,
        id: `${customer.id}-${index}-${Date.now()}`,
        customerId: customer.id,
        date: normalizeDate(history.date),
      }));

      await PurchaseHistory.bulkCreate(histories, { transaction });

      await customer.update(
        { purchaseCount: histories.length },
        { transaction },
      );
    }

    await transaction.commit();

    const createdCustomer = await getCustomerById(customer.id);
    return {
      EM: "Create customer successfully",
      EC: 0,
      DT: createdCustomer,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// READ All Customers (with Pagination & Filter)
const getAllCustomers = async (filters = {}, limit = 10, offset = 0) => {
  try {
    const { count, rows } = await Customer.findAndCountAll({
      where: filters,
      include: [{ model: PurchaseHistory, as: "purchaseHistories" }], // Sửa thành 'purchaseHistories'
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      count,
      rows,
    };
  } catch (error) {
    throw error;
  }
};

// UPDATE Customer & Lịch sử đơn hàng kèm theo
const updateCustomer = async (id, data) => {
  const transaction = await sequelize.transaction();
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return {
        EM: "Customer not found to update",
        EC: 1,
        DT: "",
      };
    }

    // Sửa bóc tách dữ liệu theo biến 'purchaseHistories'
    const { purchaseHistories, ...customerData } = data;
    if (customerData.birthday) {
      customerData.birthday = normalizeDate(customerData.birthday);
    }
    await customer.update(customerData, { transaction });

    if (purchaseHistories) {
      // 1. Xóa các lịch sử cũ của Customer này
      await PurchaseHistory.destroy({ where: { customerId: id }, transaction });

      // 2. Chuẩn hóa và lọc sạch dữ liệu trước khi nạp vào DB
      const histories = purchaseHistories.map((history, index) => {
        const { id: oldId, ...cleanHistoryData } = history;

        return {
          ...cleanHistoryData,
          id: `EX-${id}-${index}-${Date.now()}`,
          customerId: id,
          date: normalizeDate(cleanHistoryData.date),
          products: cleanHistoryData.products || "",
          invoiceLink: cleanHistoryData.invoiceLink || "",
          issue: cleanHistoryData.issue || "",
          consultant: cleanHistoryData.consultant || "",
          careStaff: cleanHistoryData.careStaff || "",
        };
      });

      // 3. Gọi Model PurchaseHistory để thực hiện lưu hàng loạt
      await PurchaseHistory.bulkCreate(histories, { transaction });

      await customer.update(
        { purchaseCount: histories.length },
        { transaction },
      );
    }

    await transaction.commit();

    const updatedCustomer = await getCustomerById(id);
    return {
      EM: "Update customer successfully",
      EC: 0,
      DT: updatedCustomer,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// DELETE Purchase History
const deletePurchaseHistory = async (customerId, historyId) => {
  try {
    const deletedCount = await PurchaseHistory.destroy({
      where: { customerId, id: historyId },
    });

    if (!deletedCount) {
      return {
        EM: "Purchase history not found",
        EC: 1,
        DT: "",
      };
    }

    const customer = await Customer.findByPk(customerId, {
      include: [{ model: PurchaseHistory, as: "purchaseHistories" }],
    });

    await customer.update({ purchaseCount: customer.purchaseHistories.length });

    return {
      EM: "Purchase history deleted successfully",
      EC: 0,
      DT: customer,
    };
  } catch (error) {
    throw error;
  }
};

// DELETE Customer
const deleteCustomer = async (id) => {
  try {
    const customer = await Customer.findByPk(id);
    if (!customer) {
      return {
        EM: "Customer not found to delete",
        EC: 1,
        DT: "",
      };
    }

    await customer.destroy();
    return {
      EM: "Customer deleted successfully",
      EC: 0,
      DT: "",
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deletePurchaseHistory,
  deleteCustomer,
};

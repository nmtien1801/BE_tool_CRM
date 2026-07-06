import db from "../models"; // Đảm bảo đường dẫn import tới thư mục chứa models của bạn chính xác

const { Customer, PurchaseHistory, sequelize } = db;

// READ Single Customer (Hàm bổ trợ nội bộ)
export const getCustomerById = async (id) => {
  try {
    const customer = await Customer.findByPk(id, {
      include: [{ model: PurchaseHistory, as: "purchaseHistories" }],
    });
    return customer;
  } catch (error) {
    throw error;
  }
};

// CREATE Customer kèm Lịch sử mua hàng ban đầu
export const createCustomer = async (data) => {
  const transaction = await sequelize.transaction();
  try {
    const { purchaseHistories, ...customerData } = data;

    const customer = await Customer.create(customerData, { transaction });

    if (purchaseHistories && purchaseHistories.length > 0) {
      const histories = purchaseHistories.map((history, index) => ({
        ...history,
        id: `PH-${customer.id}-${index}-${Date.now()}`,
        customerId: customer.id,
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
export const getAllCustomers = async (filters = {}, limit = 10, offset = 0) => {
  try {
    const { count, rows } = await Customer.findAndCountAll({
      where: filters,
      include: [{ model: PurchaseHistory, as: "purchaseHistories" }],
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
export const updateCustomer = async (id, data) => {
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

    const { purchaseHistories, ...customerData } = data;
    await customer.update(customerData, { transaction });

    if (purchaseHistories) {
      await PurchaseHistory.destroy({ where: { customerId: id }, transaction });

      const histories = purchaseHistories.map((history, index) => {
        const { id: oldId, ...cleanHistoryData } = history;

        return {
          ...cleanHistoryData,
          id: `PH-${id}-${index}-${Date.now()}`,
          customerId: id,
          products: cleanHistoryData.products || "",
          invoiceLink: cleanHistoryData.invoiceLink || "",
          issue: cleanHistoryData.issue || "",
          consultant: cleanHistoryData.consultant || "",
          careStaff: cleanHistoryData.careStaff || "",
        };
      });

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
export const deletePurchaseHistory = async (customerId, historyId) => {
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
export const deleteCustomer = async (id) => {
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

// Đóng gói tất cả object mặc định để hỗ trợ cú pháp: import CustomerService from "..."
export default {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deletePurchaseHistory,
  deleteCustomer,
};
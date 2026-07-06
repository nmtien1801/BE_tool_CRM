const db = require("../models");
const { Customer, PurchaseHistory, sequelize } = db;

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

const generatePurchaseHistoryId = (customerId) => {
  return `PH-${customerId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// READ Single Purchase History
const getPurchaseHistoryById = async (historyId) => {
  return PurchaseHistory.findByPk(historyId, {
    include: [{ model: Customer, as: "customer" }],
  });
};

// READ All Purchase Histories By Customer
const getPurchaseHistoriesByCustomer = async (customerId) => {
  const customer = await Customer.findByPk(customerId, {
    include: [{ model: PurchaseHistory, as: "purchaseHistories" }],
  });
  return customer ? customer.purchaseHistories : [];
};

// CREATE Purchase History
const createPurchaseHistory = async (customerId, data) => {
  const transaction = await sequelize.transaction();
  try {
    const customer = await Customer.findByPk(customerId, { transaction });
    if (!customer) {
      await transaction.rollback();
      return {
        EM: "Customer not found",
        EC: 1,
        DT: "",
      };
    }

    const historyData = {
      ...data,
      id: generatePurchaseHistoryId(customerId),
      customerId,
      date: normalizeDate(data.date),
      products: data.products || "",
      invoiceLink: data.invoiceLink || "",
      issue: data.issue || "",
      consultant: data.consultant || "",
      careStaff: data.careStaff || "",
      careMethods: Array.isArray(data.careMethods) ? data.careMethods : [],
      promotions: Array.isArray(data.promotions) ? data.promotions : [],
    };

    const createdHistory = await PurchaseHistory.create(historyData, {
      transaction,
    });

    const purchaseCount = await PurchaseHistory.count({
      where: { customerId },
      transaction,
    });

    await customer.update({ purchaseCount }, { transaction });

    await transaction.commit();

    return {
      EM: "Create purchase history successfully",
      EC: 0,
      DT: await getPurchaseHistoryById(createdHistory.id),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// UPDATE Purchase History
const updatePurchaseHistory = async (historyId, data) => {
  const transaction = await sequelize.transaction();
  try {
    const history = await PurchaseHistory.findByPk(historyId, { transaction });
    if (!history) {
      await transaction.rollback();
      return {
        EM: "Purchase history not found",
        EC: 1,
        DT: "",
      };
    }

    const updatedData = {
      ...data,
      date: data.date ? normalizeDate(data.date) : history.date,
      products: data.products ?? history.products,
      invoiceLink: data.invoiceLink ?? history.invoiceLink,
      issue: data.issue ?? history.issue,
      consultant: data.consultant ?? history.consultant,
      careStaff: data.careStaff ?? history.careStaff,
      careMethods: Array.isArray(data.careMethods)
        ? data.careMethods
        : history.careMethods,
      promotions: Array.isArray(data.promotions)
        ? data.promotions
        : history.promotions,
    };

    await history.update(updatedData, { transaction });
    await transaction.commit();

    return {
      EM: "Update purchase history successfully",
      EC: 0,
      DT: await getPurchaseHistoryById(history.id),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// DELETE Purchase History
const deletePurchaseHistory = async (historyId) => {
  const transaction = await sequelize.transaction();
  try {
    const history = await PurchaseHistory.findByPk(historyId, { transaction });
    if (!history) {
      await transaction.rollback();
      return {
        EM: "Purchase history not found",
        EC: 1,
        DT: "",
      };
    }

    const customerId = history.customerId;
    await history.destroy({ transaction });

    const purchaseCount = await PurchaseHistory.count({
      where: { customerId },
      transaction,
    });

    await Customer.update(
      { purchaseCount },
      { where: { id: customerId }, transaction },
    );

    await transaction.commit();

    return {
      EM: "Delete purchase history successfully",
      EC: 0,
      DT: { customerId, purchaseCount },
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Xuất bản dưới dạng CommonJS cho controller hiện tại sử dụng require()
module.exports = {
  getPurchaseHistoryById,
  getPurchaseHistoriesByCustomer,
  createPurchaseHistory,
  updatePurchaseHistory,
  deletePurchaseHistory,
};

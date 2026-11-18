import expenseService from "../service/expenseService.js";

const sendServiceResponse = (res, result) => {
  const status = result.EC === 0 ? 200 : result.EC === 2 ? 404 : 400;
  return res.status(status).json(result);
};

export const getExpenses = async (_req, res) => {
  try {
    return sendServiceResponse(res, await expenseService.getExpenses());
  } catch (error) {
    console.error("Error getting expenses:", error);
    return res.status(500).json({ EM: "Không thể lấy danh sách chi phí.", EC: -1, DT: null });
  }
};

export const createExpense = async (req, res) => {
  try {
    return sendServiceResponse(res, await expenseService.createExpense(req.body));
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ EM: "Không thể tạo khoản chi.", EC: -1, DT: null });
  }
};

export const updateExpense = async (req, res) => {
  try {
    return sendServiceResponse(res, await expenseService.updateExpense(req.params.id, req.body));
  } catch (error) {
    console.error("Error updating expense:", error);
    return res.status(500).json({ EM: "Không thể cập nhật khoản chi.", EC: -1, DT: null });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    return sendServiceResponse(res, await expenseService.deleteExpense(req.params.id));
  } catch (error) {
    console.error("Error deleting expense:", error);
    return res.status(500).json({ EM: "Không thể xóa khoản chi.", EC: -1, DT: null });
  }
};

export default { getExpenses, createExpense, updateExpense, deleteExpense };

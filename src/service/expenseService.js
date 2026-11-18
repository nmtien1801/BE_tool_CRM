import db from "../models/index.js";

const ECOSYSTEMS = ["CMIC_STUDIO", "CMIC_MEDIA"];
const CATEGORIES = [
  "Nhân sự",
  "Sản phẩm",
  "Marketing",
  "Kế toán",
  "Vận chuyển",
  "Văn phòng",
  "Tài nguyên",
  "Hoàn tiền",
  "Đầu tư",
  "Khác",
];
const EXPENSE_TYPES = ["Cố định", "Biến đổi", "Phát sinh"];
const PAYMENT_METHODS = ["Chuyển khoản", "Tiền mặt"];
const STATUSES = ["Đang về", "Tồn kho", "Đã bán", "N/A"];
const MAX_MONEY = 9999999999999.99;
const MAX_QUANTITY = 999999999.999;

const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().slice(0, 10) === value;
};

const parseNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return Number.NaN;
};

const validateExpense = (data) => {
  const errors = [];
  if (!ECOSYSTEMS.includes(data.ecosystem)) errors.push("Hệ sinh thái không hợp lệ.");
  if (typeof data.expenseName !== "string" || !data.expenseName.trim()) errors.push("Tên chi phí là bắt buộc.");
  if (!CATEGORIES.includes(data.category)) errors.push("Hạng mục không hợp lệ.");
  if (!Number.isFinite(data.unitCost) || data.unitCost < 0 || data.unitCost > MAX_MONEY) {
    errors.push("Chi phí đơn phải là số không âm và không vượt quá giới hạn.");
  } else if (Math.abs(data.unitCost * 100 - Math.round(data.unitCost * 100)) > 0.0001) {
    errors.push("Chi phí đơn tối đa 2 chữ số thập phân.");
  }
  if (!Number.isFinite(data.quantity) || data.quantity <= 0 || data.quantity > MAX_QUANTITY) {
    errors.push("Số lượng phải lớn hơn 0 và không vượt quá giới hạn.");
  } else if (Math.abs(data.quantity * 1000 - Math.round(data.quantity * 1000)) > 0.0001) {
    errors.push("Số lượng tối đa 3 chữ số thập phân.");
  }
  const totalCost = Math.round(data.unitCost * data.quantity * 100) / 100;
  if (!Number.isFinite(totalCost) || totalCost > MAX_MONEY) {
    errors.push("Chi phí tổng vượt quá giới hạn lưu trữ.");
  }
  if (!EXPENSE_TYPES.includes(data.expenseType)) errors.push("Thể loại không hợp lệ.");
  if (typeof data.isPayable !== "boolean") errors.push("Công nợ phải trả phải là giá trị boolean.");
  if (data.paymentDate && !isValidDate(data.paymentDate)) errors.push("Ngày trả tiền không hợp lệ.");
  if (!PAYMENT_METHODS.includes(data.paymentMethod)) errors.push("Hình thức thanh toán không hợp lệ.");
  if (!STATUSES.includes(data.status)) errors.push("Tình trạng không hợp lệ.");
  if (data.expenseName && String(data.expenseName).trim().length > 200) errors.push("Tên chi phí tối đa 200 ký tự.");
  if (data.sourceName != null && typeof data.sourceName !== "string") errors.push("Nguồn hàng không hợp lệ.");
  if (data.sourceName && data.sourceName.length > 200) errors.push("Nguồn hàng tối đa 200 ký tự.");
  return errors;
};

const normalizeExpense = (data) => ({
  ecosystem: data.ecosystem,
  expenseName: String(data.expenseName || "").trim(),
  category: data.category,
  sourceName: data.sourceName ? String(data.sourceName).trim() : null,
  unitCost: data.unitCost,
  quantity: data.quantity,
  totalCost: Math.round(data.unitCost * data.quantity * 100) / 100,
  expenseType: data.expenseType,
  isPayable: data.isPayable,
  paymentDate: data.paymentDate || null,
  paymentMethod: data.paymentMethod,
  status: data.status,
});

export const getExpenses = async () => {
  const expenses = await db.Expense.findAll({ order: [["createdAt", "DESC"]] });
  return { EM: "Lấy danh sách chi phí thành công.", EC: 0, DT: expenses };
};

export const createExpense = async (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { EM: "Dữ liệu chi phí không hợp lệ.", EC: 1, DT: null };
  }
  const normalizedData = {
    ...data,
    unitCost: parseNumber(data.unitCost),
    quantity: parseNumber(data.quantity),
    isPayable: data.isPayable === undefined ? false : data.isPayable,
  };
  const errors = validateExpense(normalizedData);
  if (errors.length) return { EM: errors.join(" "), EC: 1, DT: null };

  const expense = await db.Expense.create(normalizeExpense(normalizedData));
  return { EM: "Tạo khoản chi thành công.", EC: 0, DT: expense };
};

export const updateExpense = async (id, data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { EM: "Dữ liệu chi phí không hợp lệ.", EC: 1, DT: null };
  }
  const normalizedData = {
    ...data,
    unitCost: parseNumber(data.unitCost),
    quantity: parseNumber(data.quantity),
  };
  const errors = validateExpense(normalizedData);
  if (errors.length) return { EM: errors.join(" "), EC: 1, DT: null };

  const expense = await db.Expense.findByPk(id);
  if (!expense) return { EM: "Không tìm thấy khoản chi.", EC: 2, DT: null };
  await expense.update(normalizeExpense(normalizedData));
  return { EM: "Cập nhật khoản chi thành công.", EC: 0, DT: expense };
};

export const deleteExpense = async (id) => {
  const expense = await db.Expense.findByPk(id);
  if (!expense) return { EM: "Không tìm thấy khoản chi.", EC: 2, DT: null };
  await expense.destroy();
  return { EM: "Xóa khoản chi thành công.", EC: 0, DT: null };
};

export default { getExpenses, createExpense, updateExpense, deleteExpense };

import db from "../models/index.js";
import { Op } from "sequelize";

const allowedFields = ["cmicMedia", "cmicStudio"];

export const getEmployees = async () => {
  const employees = await db.User.findAll({
    where: { role: { [Op.ne]: "Admin" } },
    attributes: ["id", "fullName", "userName", "email", "role", "cmicMedia", "cmicStudio"],
    order: [["fullName", "ASC"]],
  });

  return { EM: "Lấy danh sách nhân viên thành công.", EC: 0, DT: employees };
};

export const setEmployeeEcosystem = async (userId, ecosystem, assigned) => {
  if (!allowedFields.includes(ecosystem)) {
    return { EM: "Hệ sinh thái không hợp lệ.", EC: 1, DT: "" };
  }
  if (typeof assigned !== "boolean") {
    return { EM: "Trạng thái phân công phải là boolean.", EC: 1, DT: "" };
  }

  const employee = await db.User.findByPk(userId, {
    attributes: ["id", "fullName", "userName", "email", "role", "cmicMedia", "cmicStudio"],
  });
  if (!employee) {
    return { EM: "Không tìm thấy nhân viên.", EC: 1, DT: "" };
  }

  await employee.update({ [ecosystem]: assigned });
  return { EM: "Cập nhật phân công thành công.", EC: 0, DT: employee };
};

export default { getEmployees, setEmployeeEcosystem };

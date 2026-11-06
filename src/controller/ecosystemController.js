import ecosystemService from "../service/ecosystemService.js";

export const getEmployees = async (req, res) => {
  try {
    const data = await ecosystemService.getEmployees();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error get ecosystem employees:", error);
    return res.status(500).json({ EM: "Không thể lấy danh sách nhân viên.", EC: -1, DT: "" });
  }
};

export const setEmployeeEcosystem = async (req, res) => {
  try {
    const data = await ecosystemService.setEmployeeEcosystem(
      req.params.id,
      req.params.ecosystem,
      req.body.assigned
    );
    return res.status(data.EC === 0 ? 200 : 400).json(data);
  } catch (error) {
    console.error("Error update ecosystem employee:", error);
    return res.status(500).json({ EM: "Không thể cập nhật phân công.", EC: -1, DT: "" });
  }
};

export default { getEmployees, setEmployeeEcosystem };

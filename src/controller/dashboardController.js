import dashboardService from "../service/dashboardService.js";

const sendResult = (res, result) =>
  res.status(result.EC === 0 ? 200 : 400).json(result);

export const getBusinessDashboard = async (req, res) => {
  try {
    return sendResult(res, await dashboardService.getBusinessDashboard(req.query));
  } catch (error) {
    console.error("Error loading business dashboard:", error);
    return res.status(500).json({
      EM: "Không thể tải báo cáo kinh doanh.",
      EC: -1,
      DT: null,
    });
  }
};

export const getMarketingDashboard = async (req, res) => {
  try {
    return sendResult(
      res,
      await dashboardService.getMarketingDashboard(req.query, req.dashboardUser),
    );
  } catch (error) {
    console.error("Error loading marketing dashboard:", error);
    return res.status(500).json({
      EM: "Không thể tải báo cáo marketing.",
      EC: -1,
      DT: null,
    });
  }
};

export default { getBusinessDashboard, getMarketingDashboard };

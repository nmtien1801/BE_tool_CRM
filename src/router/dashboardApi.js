import express from "express";
import dashboardController from "../controller/dashboardController.js";
import { checkUserJwt } from "../middleware/jwtAction.js";
import {
  businessDashboardAccess,
  marketingDashboardAccess,
} from "../middleware/dashboardAccess.js";

const router = express.Router();

const dashboardApi = (app) => {
  router.use(checkUserJwt);
  router.get("/dashboard/business", businessDashboardAccess, dashboardController.getBusinessDashboard);
  router.get("/dashboard/marketing", marketingDashboardAccess, dashboardController.getMarketingDashboard);
  return app.use("/api", router);
};

export default dashboardApi;

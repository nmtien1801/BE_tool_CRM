import express from "express";
import ecosystemController from "../controller/ecosystemController.js";
import adminOnly from "../middleware/adminOnly.js";
import { checkUserJwt } from "../middleware/jwtAction.js";

const router = express.Router();

const ecosystemRoutes = (app) => {
  router.use(checkUserJwt);
  router.get("/ecosystem/employees", adminOnly, ecosystemController.getEmployees);
  router.put("/ecosystem/employees/:id/:ecosystem", adminOnly, ecosystemController.setEmployeeEcosystem);
  return app.use("/api", router);
};

export default ecosystemRoutes;

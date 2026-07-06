import express from "express";
import customerController from "../controller/customerController";
import { checkUserJwt } from "../middleware/jwtAction";

const router = express.Router();

const CustomerRoutes = (app) => {
  router.use(checkUserJwt);

  router.get("/customers", customerController.getAllCustomers);
  router.get("/customers/:id", customerController.getCustomerById);
  router.post("/customers", customerController.createCustomer);
  router.put("/customers/:id", customerController.updateCustomer);
  router.patch("/customers/:id", customerController.patchCustomer);
  router.delete(
    "/customers/:id/purchase-history/:historyId",
    customerController.deletePurchaseHistory,
  );
  router.delete("/customers/:id", customerController.deleteCustomer);

  return app.use("/api", router);
};

export default CustomerRoutes;

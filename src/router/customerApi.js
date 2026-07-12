import express from "express";
import customerController from "../controller/customerController";
import { checkUserJwt } from "../middleware/jwtAction";

const router = express.Router();

const customerApi = (app) => {
  // Áp dụng middleware kiểm tra JWT mã token bảo mật cho tất cả route bên dưới
  router.use(checkUserJwt);

  // Các endpoint xử lý riêng cho Customer (Khớp với ApiCustomer ở FE)
  router.get(
    "/customers/:id/total-spent",
    customerController.getCustomerTotalSpent,
  );
  router.get("/customers", customerController.getAllCustomers);
  router.get("/customers/:id", customerController.getCustomerById);
  router.post("/customers", customerController.createCustomer);
  router.put("/customers/:id", customerController.updateCustomer);
  router.delete("/customers/:id", customerController.deleteCustomer);

  return app.use("/api", router);
};

export default customerApi;

import express from "express";
import expenseController from "../controller/expenseController.js";
import { checkUserJwt } from "../middleware/jwtAction.js";

const router = express.Router();

const expenseApi = (app) => {
  router.use(checkUserJwt);
  router.get("/expenses", expenseController.getExpenses);
  router.post("/expenses", expenseController.createExpense);
  router.put("/expenses/:id", expenseController.updateExpense);
  router.delete("/expenses/:id", expenseController.deleteExpense);
  return app.use("/api", router);
};

export default expenseApi;

import express from "express";
import purchaseHistoryController from "../controller/purchaseHistoryController";
import { checkUserJwt } from "../middleware/jwtAction";

const router = express.Router();

const PurchaseHistoryApi = (app) => {
  // Áp dụng middleware kiểm tra JWT mã token bảo mật cho tất cả route bên dưới
  router.use(checkUserJwt);
  
  // 1. Lấy lịch sử mua hàng (Truyền qua Query: /api/purchase-history?customerId=2)
  router.get("/purchase-history", purchaseHistoryController.getPurchaseHistoryByCustomerId);

  // 2. Tạo mới lịch sử mua hàng (Truyền customerId trong Body của request)
  router.post(
    "/purchase-history",
    purchaseHistoryController.createPurchaseHistory,
  );

  // 3. Cập nhật bản ghi đơn hàng ( historyId giữ lại params hoặc truyền body tùy bạn, ở đây đưa historyId lên param ngắn gọn)
  router.put(
    "/purchase-history/:historyId",
    purchaseHistoryController.updatePurchaseHistory,
  );

  // 4. Xóa đơn hàng (Truyền historyId qua param cho đúng chuẩn RESTful)
  router.delete(
    "/purchase-history/:historyId",
    purchaseHistoryController.deletePurchaseHistory,
  );

  return app.use("/api", router);
};

export default PurchaseHistoryApi;

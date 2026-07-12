"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Chèn dữ liệu thẳng vào bảng vật lý "Customer" (Viết hoa y hệt dBeaver)
    await queryInterface.bulkInsert(
      "Customer",
      [
        {
          id: 1,
          fullName: "Nguyễn Minh Tiền",
          birthday: "2000-06-28",
          address: "Quận 1, TP. HCM",
          phone: "0912345678",
          email: "tien.nguyen@gmail.com",
          facebook: "https://fb.com/tiennguyen",
          ecosystem: "course",
          purchaseCount: 2, // Giữ nguyên CamelCase theo đúng cấu trúc cột bạn tạo
          label: "Đã mua hàng",

          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          fullName: "Trần Văn B",
          birthday: "1995-03-12",
          address: "Quận 3, TP. HCM",
          phone: "0987654321",
          email: "tranvanb@gmail.com",
          facebook: null,
          ecosystem: "retail",
          purchaseCount: 0,
          label: "Lạnh",

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );

    // 2. Chèn dữ liệu thẳng vào bảng vật lý "PurchaseHistory" (Viết hoa y hệt dBeaver)
    await queryInterface.bulkInsert(
      "PurchaseHistory",
      [
        {
          id: "1-0-init",
          customerId: 1,
          date: "2026-03-15",
          products: "Khóa học Pro Video Editing",
          invoiceLink: "https://example.com/invoice_01.pdf",
          // Sử dụng bulkInsert thuần thì dữ liệu mảng/object bắt buộc bọc qua JSON.stringify
          careMethods: JSON.stringify([
            "Zalo OA",
            "Email Marketing",
            "Messenger",
          ]),
          promotions: JSON.stringify([{ event: "Ưu đãi mở bán sớm -30%" }]),
          consultant: "NguyenVanA",
          careStaff: "TranThiB",
          category: "Khóa học",
          itemType: "Online Course",
          quote: "14.999.000",
          price: 14999000,
          rentalDays: 0,
          paymentMethod: "Chuyển khoản",
          customerSource: "Zalo OA",
          seller: "NguyenVanA",
          issue: "Cần tìm tool tối ưu quy trình render video tự động",

          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "1-1-init",
          customerId: 1,
          date: "2026-05-20",
          products: "Gói nâng cấp Pro Video Editing",
          invoiceLink: "https://example.com/invoice_02.pdf",
          careMethods: JSON.stringify(["Zalo OA", "Email Marketing"]),
          promotions: JSON.stringify([{ event: "Ưu đãi mở bán sớm -40%" }]),
          consultant: "TranThiB",
          careStaff: "LeVanC",
          category: "Gói nâng cấp",
          itemType: "Subscription",
          quote: "8.999.000",
          price: 8999000,
          rentalDays: 0,
          paymentMethod: "Tiền mặt",
          customerSource: "Email Marketing",
          seller: "TranThiB",
          issue: "Cần tìm tool tối ưu quy trình render video tự động",

          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {},
    );

    // 3. Đồng bộ lại chuỗi tự tăng ID cho bảng Customer để tránh lỗi trùng khóa chính (Bọc tên bảng bằng dấu '"')
    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"Customer"', 'id'), (SELECT MAX(id) FROM "Customer"));`,
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa dữ liệu bảng phụ trước để tránh dính ràng buộc khóa ngoại
    await queryInterface.bulkDelete("PurchaseHistory", null, {});
    await queryInterface.bulkDelete("Customer", null, {});
  },
};

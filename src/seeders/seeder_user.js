"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert(
      "User",
      [
        {
          id: 1,
          userName: "a", // Sinh tự động từ email để làm account đăng nhập
          fullName: "Nguyễn Minh Tiền",
          email: "tien.nguyen@gmail.com",
          password: "$2a$10$zHwMBVyL3Cbwq8hfEFryJeVaUW45Dxs.KuLUKWf9DAMtTJzp3m5vK",
          role: "Admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userName: "b.tran",
          fullName: "Trần Thị B",
          email: "b.tran@gmail.com",
          password: "$2a$10$zHwMBVyL3Cbwq8hfEFryJeVaUW45Dxs.KuLUKWf9DAMtTJzp3m5vK",
          role: "Staff",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          userName: "c.le",
          fullName: "Lê Văn C",
          email: "c.le@gmail.com",
          password: "$2a$10$zHwMBVyL3Cbwq8hfEFryJeVaUW45Dxs.KuLUKWf9DAMtTJzp3m5vK",
          role: "Staff",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // 2. Đồng bộ lại chuỗi tự tăng ID cho bảng User tránh lỗi trùng khóa chính (PostgreSQL)
    await queryInterface.sequelize.query(
      `SELECT setval(pg_get_serial_sequence('"User"', 'id'), (SELECT MAX(id) FROM "User"));`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa sạch dữ liệu bảng User khi undo seed
    await queryInterface.bulkDelete("User", null, {});
  },
};

// npx sequelize-cli db:seed --seed seeder_user.js
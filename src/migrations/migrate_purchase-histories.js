// migrations/XXXXXXXXXXXXXX-create-purchase-histories.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PurchaseHistory', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING // Định dạng dạng "customerId-index" hoặc UUID
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Customer', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: { type: Sequelize.DATEONLY },
      products: { type: Sequelize.TEXT },
      invoiceLink: { type: Sequelize.STRING },
      careMethods: { type: Sequelize.JSONB }, // Lưu mảng dạng ["Zalo OA", "Email"]
      promotions: { type: Sequelize.JSONB },  // Lưu mảng object dạng [{event: "..."}]
      consultant: { type: Sequelize.STRING },
      careStaff: { type: Sequelize.STRING },
      issue: { type: Sequelize.TEXT },
      behaviorMetric: { type: Sequelize.TEXT },
      isCared: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PurchaseHistory');
  }
};
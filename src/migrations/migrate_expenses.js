"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Expense", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      ecosystem: { type: Sequelize.STRING, allowNull: false },
      expenseName: { type: Sequelize.STRING, allowNull: false },
      category: { type: Sequelize.STRING, allowNull: false },
      sourceName: { type: Sequelize.STRING, allowNull: true },
      unitCost: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      quantity: { type: Sequelize.DECIMAL(12, 3), allowNull: false },
      totalCost: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      expenseType: { type: Sequelize.STRING, allowNull: false },
      isPayable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      paymentDate: { type: Sequelize.DATEONLY, allowNull: true },
      paymentMethod: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Expense");
  },
};

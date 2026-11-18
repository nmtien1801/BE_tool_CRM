"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Expense extends Model {}

  Expense.init(
    {
      ecosystem: { type: DataTypes.STRING, allowNull: false },
      expenseName: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false },
      sourceName: { type: DataTypes.STRING, allowNull: true },
      unitCost: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      quantity: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
      totalCost: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      expenseType: { type: DataTypes.STRING, allowNull: false },
      isPayable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      paymentDate: { type: DataTypes.DATEONLY, allowNull: true },
      paymentMethod: { type: DataTypes.STRING, allowNull: false },
      status: { type: DataTypes.STRING, allowNull: false },
    },
    {
      sequelize,
      modelName: "Expense",
      tableName: "Expense",
      freezeTableName: true,
    },
  );

  return Expense;
};

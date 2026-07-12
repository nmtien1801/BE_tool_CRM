const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class PurchaseHistory extends Model {
    static associate(models) {
      PurchaseHistory.belongsTo(models.Customer, {
        foreignKey: "customerId",
        as: "customer",
      });
    }
  }
  PurchaseHistory.init(
    {
      id: { type: DataTypes.STRING, primaryKey: true },
      customerId: DataTypes.INTEGER,
      date: DataTypes.DATEONLY,
      products: DataTypes.TEXT,
      invoiceLink: DataTypes.STRING,
      careMethods: DataTypes.JSONB,
      promotions: DataTypes.JSONB,
      consultant: DataTypes.STRING,
      careStaff: DataTypes.STRING,
      category: DataTypes.STRING,
      itemType: DataTypes.STRING,
      quote: DataTypes.STRING,
      price: DataTypes.FLOAT,
      rentalDays: { type: DataTypes.INTEGER, defaultValue: 0 },
      paymentMethod: DataTypes.STRING,
      customerSource: DataTypes.STRING,
      seller: DataTypes.STRING,
      issue: DataTypes.TEXT,
      behaviorMetric: DataTypes.TEXT,
      isCared: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      modelName: "PurchaseHistory",
      tableName: "PurchaseHistory", // Khớp chính xác 100% với chữ viết hoa trong ảnh dBeaver
      freezeTableName: true, // Đóng băng tên bảng, không tự ý thay đổi
    },
  );
  return PurchaseHistory;
};

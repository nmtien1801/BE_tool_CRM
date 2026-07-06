const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class PurchaseHistory extends Model {
    static associate(models) {
      PurchaseHistory.belongsTo(models.Customer, {
        foreignKey: 'customerId',
        as: 'customer'
      });
    }
  }   
  PurchaseHistory.init({
    id: { type: DataTypes.STRING, primaryKey: true },
    customerId: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    products: DataTypes.TEXT,
    invoiceLink: DataTypes.STRING,
    careMethods: DataTypes.JSONB,
    promotions: DataTypes.JSONB,
    consultant: DataTypes.STRING,
    careStaff: DataTypes.STRING,
    issue: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'PurchaseHistory',
    tableName: 'PurchaseHistory', // Khớp chính xác 100% với chữ viết hoa trong ảnh dBeaver
    freezeTableName: true         // Đóng băng tên bảng, không tự ý thay đổi
  });
  return PurchaseHistory;
};
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Customer extends Model {
    static associate(models) {
      Customer.hasMany(models.PurchaseHistory, {
        foreignKey: 'customerId',
        as: 'purchaseHistories'
      });
    }
  }
  Customer.init({
    fullName: DataTypes.STRING,      // Tạo cột fullName
    birthday: DataTypes.DATEONLY,
    address: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    facebook: DataTypes.STRING,
    ecosystem: DataTypes.STRING,
    purchaseCount: DataTypes.INTEGER, // Tạo cột purchaseCount
    label: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Customer',
    tableName: 'Customer',       // Giữ nguyên tên table vật lý viết thường
    freezeTableName: true,        // Không tự ý đổi tên bảng
    timestamps: true              // Sẽ tạo ra 2 cột là createdAt và updatedAt (chữ hoa chữ thường)
  });
  return Customer;
};
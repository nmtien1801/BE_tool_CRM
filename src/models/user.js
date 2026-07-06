"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {}
  }

  User.init(
    {
      // Giữ lại userName làm tài khoản đăng nhập
      userName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // Thêm fullName để nhận dữ liệu từ mock data (Nguyễn Minh Tiền, Trần Thị B,...)
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Operator",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "User",
    },
  );

  return User;
};

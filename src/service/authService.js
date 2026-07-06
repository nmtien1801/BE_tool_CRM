import db from "../models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import dotenv from "dotenv";
import _ from "lodash";
dotenv.config();

// ====================== Helper ======================
const salt = bcrypt.genSaltSync(10);

const hashPassword = (password) => {
  return bcrypt.hashSync(password, salt);
};

const checkPassword = (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compareSync(plainPassword, hashedPassword);
};

// ====================== Check Exists ======================
const checkUserNameExists = async (userName) => {
  const user = await db.User.findOne({ where: { userName } });
  return !!user;
};

const checkPhoneExists = async (phone) => {
  if (!phone) return false;
  const user = await db.User.findOne({ where: { phone } });
  return !!user;
};

const checkEmailExists = async (email) => {
  if (!email) return false;
  const user = await db.User.findOne({ where: { email } });
  return !!user;
};

// ====================== REGISTER ======================
const handleRegister = async (rawData) => {
  try {
    // Kiểm tra trùng tài khoản đăng nhập
    const isUserExists = await checkUserNameExists(rawData.userName);
    if (isUserExists) {
      return { EM: "Username already exists", EC: 1, DT: "" };
    }

    const isEmailExists = await checkEmailExists(rawData.email);
    if (isEmailExists) {
      return { EM: "Email already exists", EC: 1, DT: "" };
    }

    if (rawData.phone) {
      const isPhoneExists = await checkPhoneExists(rawData.phone);
      if (isPhoneExists) {
        return { EM: "Phone number already exists", EC: 1, DT: "" };
      }
    }

    const newUser = await db.User.create({
      userName: rawData.userName,
      fullName: rawData.fullName || rawData.userName, // Backup bằng userName nếu thiếu dữ liệu
      email: rawData.email,
      password: hashPassword(rawData.password),
      phone: rawData.phone || "",
      address: rawData.address || "",
      role: rawData.role || "Operator",
      image: rawData.image || "",
    });

    return {
      EM: "Register successfully",
      EC: 0,
      DT: {
        id: newUser.id,
        email: newUser.email,
        userName: newUser.userName,
        fullName: newUser.fullName,
      },
    };
  } catch (error) {
    console.log(">>> Error Register:", error);
    return {
      EM: "Something went wrong in service (register)",
      EC: -2,
      DT: "",
    };
  }
};

// ====================== LOGIN ======================
const handleLogin = async (rawData) => {
  try {
    if (!rawData.userName || !rawData.password) {
      return { EM: "Missing required fields", EC: 1, DT: "" };
    }

    const user = await db.User.findOne({
      where: { userName: rawData.userName },
    });

    if (!user) {
      return { EM: "Username or password is invalid", EC: 1, DT: "" };
    }

    if (!user.password) {
      return { EM: "Account password is not configured", EC: 1, DT: "" };
    }

    const isPasswordValid = checkPassword(rawData.password, user.password);
    if (!isPasswordValid) {
      return { EM: "Username or password is invalid", EC: 1, DT: "" };
    }

    const userWithoutPassword = { ...user.toJSON() };
    delete userWithoutPassword.password;

    return {
      EM: "Login success",
      EC: 0,
      DT: userWithoutPassword,
    };
  } catch (error) {
    console.log("Error in handleLogin:", error);
    return { EM: "Error from server", EC: -1, DT: "" };
  }
};

const changePassword = async (userID, rawData) => {
  try {
    let user = await db.User.findOne({ where: { id: userID } });
    if (!user) {
      return { EM: "Không tìm thấy người dùng", EC: 1, DT: "" };
    }

    const isPasswordCorrect = checkPassword(rawData.PassWordOld, user.password);
    if (!isPasswordCorrect) {
      return { EM: "Mật khẩu cũ không chính xác", EC: 1, DT: "" };
    }

    const hashedNewPassword = hashPassword(rawData.PassWordNew);
    await user.update({ password: hashedNewPassword });

    return { EM: "Đổi mật khẩu thành công", EC: 0, DT: "" };
  } catch (error) {
    console.error(">>> Lỗi đổi mật khẩu:", error);
    return { EM: "Error from service (changePassword)", EC: -1, DT: "" };
  }
};

const updateProfile = async (userID, rawData) => {
  try {
    let user = await db.User.findOne({ where: { id: userID } });
    if (!user) {
      return { EM: "Không tìm thấy người dùng", EC: 1, DT: "" };
    }

    await user.update({
      userName: rawData.userName ?? user.userName,
      fullName: rawData.fullName ?? user.fullName, // Cập nhật cả fullName
      phone: rawData.phone ?? user.phone,
      email: rawData.email ?? user.email,
      address: rawData.address ?? user.address,
    });

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return { EM: "Cập nhật hồ sơ thành công", EC: 0, DT: updatedUser };
  } catch (error) {
    console.error(">>> Lỗi cập nhật hồ sơ:", error);
    return { EM: "Error from service (updateProfile)", EC: -1, DT: "" };
  }
};

const getListUser = async (query = {}) => {
  try {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const offset = (page - 1) * limit;
    const where = {};

    // Tìm kiếm mờ theo fullName hoặc email nếu cần thiết lập bộ lọc search ở Server
    if (query.search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${query.search}%` } },
        { email: { [Op.iLike]: `%${query.search}%` } },
      ];
    }

    const { count, rows } = await db.User.findAndCountAll({
      where: where,
      limit: limit,
      offset: offset,
      attributes: { exclude: ["password"] }, // Loại bỏ sẵn mật khẩu để tăng tính bảo mật
      order: [["createdAt", "DESC"]],
    });

    return {
      EM: "lấy danh sách thành công",
      EC: 0,
      DT: {
        user: rows,
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error(">>> Lỗi lấy danh sách:", error);
    return { EM: "Error from service", EC: -1, DT: "" };
  }
};

const createUser = async (rawData) => {
  try {
    const isUserExists = await checkUserNameExists(rawData.userName);
    if (isUserExists) {
      return { EM: "Username already exists", EC: 1, DT: "" };
    }

    if (rawData.email) {
      const isEmailExists = await checkEmailExists(rawData.email);
      if (isEmailExists) {
        return { EM: "Email already exists", EC: 1, DT: "" };
      }
    }

    if (rawData.phone) {
      const isPhoneExists = await checkPhoneExists(rawData.phone);
      if (isPhoneExists) {
        return { EM: "Phone number already exists", EC: 1, DT: "" };
      }
    }

    const password = rawData.password || "123456";
    const newUser = await db.User.create({
      userName: rawData.userName,
      fullName: rawData.fullName || rawData.userName, // Thêm fullName
      email: rawData.email || "",
      password: hashPassword(password),
      phone: rawData.phone || "",
      address: rawData.address || "",
      role: rawData.role || "Operator",
      image: rawData.image || "",
    });

    return {
      EM: "User created successfully",
      EC: 0,
      DT: {
        id: newUser.id,
        email: newUser.email,
        userName: newUser.userName,
        fullName: newUser.fullName,
      },
    };
  } catch (error) {
    console.error(">>> Error createUser:", error);
    return { EM: "Error from service (createUser)", EC: -1, DT: "" };
  }
};

const updateUser = async (rawData) => {
  try {
    const user = await db.User.findOne({ where: { id: rawData.id } });
    if (!user) {
      return { EM: "Không tìm thấy người dùng", EC: 1, DT: "" };
    }

    if (rawData.email) {
      const existed = await db.User.findOne({
        where: { email: rawData.email, id: { [Op.ne]: rawData.id } },
      });
      if (existed) {
        return { EM: "Email already exists", EC: 1, DT: "" };
      }
    }

    if (rawData.phone) {
      const existedPhone = await db.User.findOne({
        where: { phone: rawData.phone, id: { [Op.ne]: rawData.id } },
      });
      if (existedPhone) {
        return { EM: "Phone number already exists", EC: 1, DT: "" };
      }
    }

    const updateObj = {
      userName: rawData.userName ?? user.userName,
      fullName: rawData.fullName ?? user.fullName, // Cập nhật cả fullName tại đây
      phone: rawData.phone ?? user.phone,
      email: rawData.email ?? user.email,
      address: rawData.address ?? user.address,
      role: rawData.role ?? user.role,
      image: rawData.image ?? user.image,
    };

    if (rawData.password) {
      updateObj.password = hashPassword(rawData.password);
    }

    await user.update(updateObj);

    const result = user.toJSON();
    delete result.password;

    return { EM: "Cập nhật người dùng thành công", EC: 0, DT: result };
  } catch (error) {
    console.error(">>> Error updateUser:", error);
    return { EM: "Error from service (updateUser)", EC: -1, DT: "" };
  }
};

const deleteUser = async (userID) => {
  try {
    const user = await db.User.findOne({ where: { id: userID } });
    if (!user) {
      return { EM: "Không tìm thấy người dùng", EC: 1, DT: "" };
    }

    await user.destroy();
    return { EM: "Xóa người dùng thành công", EC: 0, DT: "" };
  } catch (error) {
    console.error(">>> Error deleteUser:", error);
    return { EM: "Error from service (deleteUser)", EC: -1, DT: "" };
  }
};

const resetPassword = async (rawData) => {
  try {
    if (!rawData.id) {
      return { EM: "Missing required fields (id)", EC: 1, DT: "" };
    }

    // 1. Tìm xem user có tồn tại không
    const user = await db.User.findOne({ where: { id: rawData.id } });
    if (!user) {
      return {
        EM: "Không tìm thấy người dùng để reset mật khẩu",
        EC: 1,
        DT: "",
      };
    }

    // 2. Mã hóa mật khẩu mặc định "123456"
    const defaultPassword = "123456";
    const hashedNewPassword = hashPassword(defaultPassword);

    // 3. Cập nhật trực tiếp vào DB không qua kiểm tra mật khẩu cũ
    await user.update({ password: hashedNewPassword });

    return {
      EM: "Reset mật khẩu về '123456' thành công!",
      EC: 0,
      DT: { id: user.id, userName: user.userName },
    };
  } catch (error) {
    console.error(">>> Lỗi tại service resetPassword:", error);
    return { EM: "Error from service (resetPassword)", EC: -1, DT: "" };
  }
};

// ====================== EXPORT ======================
export default {
  handleRegister,
  handleLogin,
  changePassword,
  updateProfile,
  getListUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};

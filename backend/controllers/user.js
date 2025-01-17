const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sequelize = require("../models").sequelize;

const createUser = async (req, res) => {
  const { first_name, last_name, email, phone_number, password, role } =
    req.body;

  if (!["customer", "admin", "driver"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  if (
    !first_name ||
    !last_name ||
    !email ||
    !phone_number ||
    !password ||
    !role
  ) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  const transaction = await sequelize.transaction();

  try {
    const existingUser = await User.findOne({ where: { email }, transaction });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already exists. Please use a different one." });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.SALT_ROUNDS)
    );

    const newUser = await User.create(
      {
        first_name,
        last_name,
        email,
        phone_number,
        password: hashedPassword,
        role,
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      user: newUser,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({ success: true, message: "Login successful.", token });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

module.exports = { createUser, loginUser };

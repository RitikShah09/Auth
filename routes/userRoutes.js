const express = require("express");
const User = require("../models/user");

const router = express.Router();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const { model } = require("mongoose");

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    const url = `http://localhost:8080/auth/verify/${newUser._id}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: newUser.email,
      subject: "Verify your email",
      text: `Click on the link to verify your email: ${url}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      msg: "User registered successfully check your mail for verification.",
    });
  } catch (error) {
    res.json("Internal Server Error");
  }
});

router.get("/verify/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ msg: "User already verified" });
    }
    user.isVerified = true;
    await user.save();
    res.json({ msg: "User verified successfully" });
  } catch (error) {
    res.status(500).json("Internal Server Error");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ msg: "User is not verified" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const options = {
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res
      .status(200)
      .cookie("token", token, options)
      .json({ success: true, id: user._id, token });
  } catch (error) {
    res.json("Internal Server Error");
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    const url = `http://localhost:8080/auth/reset-password/${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Reset Password",
      text: `Click on the link to reset your password: ${url}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ msg: "Password reset link sent to your mail" });
  } catch (error) {
    res.json("Internal Server Error");
  }
});

router.put("/reset-password/:token", async (req, res) => {
    const token = req.params.token;
    const { password } = req.body;
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id);
      if (!user) {
        return res.status(400).json({ msg: "User not found" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();
      res.json({ msg: "Password reset successfully" });
    } catch (error) {
      res.status(500).json("Internal Server Error");
    }
});

module.exports = router;

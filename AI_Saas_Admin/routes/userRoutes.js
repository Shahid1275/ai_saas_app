import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  refreshToken,
  logout,
  login,
} from "../controllers/userController.js";

const userRouter = express.Router();

// Create a new user
userRouter.post("/users", createUser);

//refresh token
userRouter.post("/refresh-token", refreshToken);
// Get all users
userRouter.get("/users", getUsers);
userRouter.post("/login", login); // <-- NEW LOGIN ROUTE
// Get user by ID
userRouter.get("/users/:id", getUserById);
//
// logou route
userRouter.post("/logout", logout);
// Update user by ID
userRouter.put("/users/:id", updateUser);

// Delete user by ID
userRouter.delete("/users/:id", deleteUser);

export default userRouter;

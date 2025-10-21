import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decode = JWT.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).send({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        if(!user || user.role !== 1) {
            return res.status(401).send({
                success: false,
                message: "Unauthorized Access",
            });
        } else {
            next();
        }
    } catch (error) {
        res.status(500).send({
            success: false,
            message: "Error in admin middleware",
        });
    }
};
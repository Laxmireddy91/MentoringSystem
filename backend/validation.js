import Joi from "joi";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,72}$/;

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid("student", "mentor", "hod").required(),
});

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(strongPassword).required(),
  role: Joi.string().valid("student", "mentor", "hod").default("student"),
  department: Joi.string().trim().max(120).allow(""),
  phone: Joi.string().trim().max(30).allow(""),
  usn: Joi.string().trim().max(30).allow(""),
  semester: Joi.string().trim().max(30).allow(""),
});

export const messageSchema = Joi.object({
  receiver: Joi.string().hex().length(24).required(),
  message: Joi.string().trim().min(1).max(2000).required(),
});

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ success: false, message: error.details.map(d => d.message).join(", ") });
    req.body = value;
    next();
  };
}

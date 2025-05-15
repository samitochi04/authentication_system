import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      message: "Validation error",
      errors: errors.array().map((err) => {
        // Access field name safely with type checking
        const fieldName = typeof err === 'object' && err !== null 
          ? (
              // Try multiple possible property names based on express-validator version
              'path' in err ? String(err.path) : 
              'param' in err ? String(err.param) : 
              'field' in err ? String(err.field) : 
              'location' in err && 'path' in err ? `${err.location}.${err.path}` : 
              'unknown'
          )
          : 'unknown';
          
        return {
          field: fieldName,
          message: err.msg,
        };
      }),
    });
    return;
  }

  next();
};
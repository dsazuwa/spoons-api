import { NextFunction, Request, Response } from 'express';

import { ApiError } from '../../utils';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  next(
    ApiError.notFound(`Resource not found - ${req.method} ${req.originalUrl}`),
  );
};

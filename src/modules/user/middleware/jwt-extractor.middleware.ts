import { NextFunction, Request, Response } from 'express';

const extractJwtFromCookie = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const jwt = req.cookies['access-token'];

  if (jwt) req.headers.authorization = `Bearer ${jwt}`;

  next();
};

export default extractJwtFromCookie;

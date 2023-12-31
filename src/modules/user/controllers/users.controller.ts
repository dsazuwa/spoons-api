import { NextFunction, Request, Response } from 'express';

import userService from '../services/user.service';
import messages from '../utils/messages';

export const getUserData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await userService.getUserFromReq(req);

    if (!user) return res.status(401).json({ message: messages.GET_USER_FAIL });

    res.status(200).json({ user });
  } catch (e) {
    next(e);
  }
};

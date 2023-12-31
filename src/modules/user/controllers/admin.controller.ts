import { NextFunction, Request, Response } from 'express';

import { adminService, userService } from '../services';
import messages from '../utils/messages';

export const updateUserName = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId ?? -1;
    const { firstName, lastName } = req.body;

    await adminService.updateName(userId, firstName, lastName);

    const user = await userService.getUserWithoutId(userId, true);

    res.status(200).json({ user, message: messages.UPDATE_USER_NAME });
  } catch (e) {
    next(e);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.userId ?? -1;
    const { currentPassword, newPassword } = req.body;

    const result = await adminService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );

    if (!result)
      return res.status(404).json({ message: messages.PASSWORD_CHANGE_FAIL });

    res.status(200).json({ message: messages.PASSWORD_CHANGE_SUCCESS });
  } catch (e) {
    next(e);
  }
};

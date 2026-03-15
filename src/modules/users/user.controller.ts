import { Request, Response } from "express";
import { catchAsync } from "../../shared/utils/catch-async";
import { getPagination } from "../../shared/utils/pagination";
import { sendResponse } from "../../shared/utils/send-response";
import { usersService } from "./user.service";

const listForAdmin = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip, take } = getPagination(req.query);
  const { items, total } = await usersService.listAdmin({
    skip,
    take,
    search: String(req.query.search || ""),
  });

  return sendResponse(res, {
    status: 200,
    success: true,
    message: "Users fetched",
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || "");
  const user = await usersService.findById(id);

  return sendResponse(res, {
    status: 200,
    success: true,
    message: "User fetched",
    data: user,
  });
});

const updateById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || "");
  const payload = req.body;
  const updated = await usersService.updateById(id, payload);

  return sendResponse(res, {
    status: 200,
    success: true,
    message: "User updated",
    data: updated,
  });
});

const blockUser = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id || "");
  const updated = await usersService.blockUser(id);

  return sendResponse(res, {
    status: 200,
    success: true,
    message: "User blocked",
    data: updated,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user)
    return sendResponse(res, {
      status: 401,
      success: false,
      message: "Unauthorized",
      data: null,
    });

  const payload = req.body;
  const updated = await usersService.updateById(user.id, payload);

  return sendResponse(res, {
    status: 200,
    success: true,
    message: "Profile updated",
    data: updated,
  });
});

export const usersController = {
  listForAdmin,
  getById,
  updateById,
  blockUser,
  updateMe,
};

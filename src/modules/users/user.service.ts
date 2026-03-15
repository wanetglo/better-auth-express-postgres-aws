import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

const listAdmin = async ({
  skip,
  take,
  search,
}: {
  skip?: number;
  take?: number;
  search?: string;
}) => {
  const where: Prisma.UserWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
};

const findById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

const updateById = async (
  id: string,
  payload: Prisma.UserUncheckedUpdateInput,
) => {
  return prisma.user.update({ where: { id }, data: payload });
};

const blockUser = async (id: string) => {
  return prisma.user.update({ where: { id }, data: { status: "BLOCKED" } });
};

export const usersService = {
  listAdmin,
  findById,
  updateById,
  blockUser,
};

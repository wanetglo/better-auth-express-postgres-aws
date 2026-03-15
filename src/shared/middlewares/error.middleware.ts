import { ErrorRequestHandler, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import { envVars } from "../../config/env";
import ApiError from "../errors/api-error";
import { AppError } from "../errors/app-error";
import { handleZodError } from "../errors/zod-error";

type ErrorSource = {
  path: string;
  message: string;
};

type ErrorResponse = {
  success: false;
  message: string;
  errorSources: ErrorSource[];
  stack?: string;
  timestamp?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const toErrorSource = (value: unknown): ErrorSource | null => {
  if (!isRecord(value)) return null;

  const message =
    typeof value.message === "string" ? value.message : "Unknown error";
  const path =
    typeof value.path === "string"
      ? value.path
      : typeof value.field === "string"
        ? value.field
        : "";

  return { path, message };
};

const getStatusCode = (value: unknown): number | null => {
  if (!isRecord(value)) return null;

  const statusCodeCandidate =
    typeof value.statusCode === "number"
      ? value.statusCode
      : typeof value.status === "number"
        ? value.status
        : null;

  if (
    typeof statusCodeCandidate === "number" &&
    Number.isInteger(statusCodeCandidate) &&
    statusCodeCandidate >= 400 &&
    statusCodeCandidate <= 599
  ) {
    return statusCodeCandidate;
  }

  return null;
};

const isJsonParseError = (value: unknown): value is SyntaxError => {
  if (!(value instanceof SyntaxError)) return false;
  if (!isRecord(value)) return false;

  return "body" in value;
};

const errorHandler: ErrorRequestHandler = async (
  err: unknown,
  req: Request,
  res: Response,
) => {
  const isDevelopment = envVars.NODE_ENV === "development";

  if (isDevelopment) {
    console.error("Global Error Handler:", err);
  }

  let errorSources: ErrorSource[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = "Internal Server Error";
  let stack: string | undefined;

  if (err instanceof z.ZodError) {
    const zodResp = handleZodError(err);
    statusCode = zodResp.statusCode ?? status.BAD_REQUEST;
    message = zodResp.message;
    errorSources = zodResp.errorSources;
    stack = err.stack;
  } else if (err instanceof AppError || err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [{ path: "", message: err.message }];
  } else if (isJsonParseError(err)) {
    statusCode = status.BAD_REQUEST;
    message = "Invalid JSON payload";
    stack = err.stack;
    errorSources = [{ path: "body", message }];
  } else if (err instanceof Error) {
    statusCode = getStatusCode(err) ?? status.INTERNAL_SERVER_ERROR;
    message = err.message || message;
    stack = err.stack;
    errorSources = [{ path: "", message }];
  } else if (isRecord(err)) {
    statusCode = getStatusCode(err) ?? status.INTERNAL_SERVER_ERROR;

    if (typeof err.message === "string" && err.message.length > 0) {
      message = err.message;
    }

    const sources: ErrorSource[] = [];
    if (Array.isArray(err.errorSources)) {
      err.errorSources.forEach((source) => {
        const normalized = toErrorSource(source);
        if (normalized) {
          sources.push(normalized);
        }
      });
    }

    if (Array.isArray(err.errors)) {
      err.errors.forEach((source) => {
        const normalized = toErrorSource(source);
        if (normalized) {
          sources.push(normalized);
        }
      });
    }

    errorSources =
      sources.length > 0 ? sources : [{ path: "", message: String(message) }];
  }

  // normalize and deduplicate error sources; ensure at least one source
  if (!Array.isArray(errorSources) || errorSources.length === 0) {
    errorSources = [{ path: "", message: String(message) }];
  }

  const seen = new Set<string>();
  errorSources = errorSources
    .map((s) => ({ path: s.path || "", message: s.message || "" }))
    .filter((s) => {
      const key = `${s.path}|${s.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const errorResponse: ErrorResponse = {
    success: false,
    message,
    errorSources,
    stack: isDevelopment ? stack : undefined,
    timestamp: new Date().toISOString(),
  };

  // ensure JSON content type and send response
  res.type("application/json");
  res.status(statusCode).json(errorResponse);
};;

export const globalErrorHandler = errorHandler;

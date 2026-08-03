import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId: string;
  };
};

export type ListMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sort?: string;
  order?: "asc" | "desc";
};

export function createRequestId() {
  return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 201, ...init });
}

export function listOk<T>(data: T[], meta: ListMeta, init?: ResponseInit) {
  return NextResponse.json({ data, meta }, { status: 200, ...init });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(
  code: string,
  message: string,
  options?: {
    status?: number;
    details?: unknown;
    requestId?: string;
  },
) {
  const requestId = options?.requestId ?? createRequestId();
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      details: options?.details,
      requestId,
    },
  };

  return NextResponse.json(body, { status: options?.status ?? 400 });
}

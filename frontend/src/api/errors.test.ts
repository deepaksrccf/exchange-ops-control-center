import axios from "axios";
import { describe, expect, it } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";

import { getApiErrorMessage } from "./errors";

describe("getApiErrorMessage", () => {
  it("returns the backend message from an Axios error", () => {
    const error = new axios.AxiosError(
      "Request failed",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 409,
        statusText: "Conflict",
        headers: {},
        config: {
          headers: {},
        } as InternalAxiosRequestConfig,
        data: { message: "Generator is already running." },
      },
    );

    expect(getApiErrorMessage(error)).toBe("Generator is already running.");
  });

  it("returns a safe fallback for an unknown error", () => {
    expect(getApiErrorMessage({}, "Generator request failed.")).toBe(
      "Generator request failed.",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

import { queryClient } from "../api/queryClient";
import { router } from "./router";

describe("application router", () => {
  it("renders the operations overview", async () => {
    window.history.pushState({}, "", "/");

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Operations Overview",
      }),
    ).toBeInTheDocument();
  });
});

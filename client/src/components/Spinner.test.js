import React from "react";
import { act, render, screen } from "@testing-library/react";
import Spinner from "../components/Spinner";
import { useNavigate, useLocation } from "react-router-dom";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

beforeEach(() => {
  jest.useFakeTimers(); // use fake timers for setInterval
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe("Spinner Component", () => {
  it("renders countdown and spinner", async () => {
    useLocation.mockReturnValue({ pathname: "/current" });
    render(<Spinner path="login" />);
    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("counts down and calls navigate when reaching 0", async () => {
    jest.useFakeTimers();
    const navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    useLocation.mockReturnValue({ pathname: "/current" });

    render(<Spinner path="login" />);

    // advance timers by 3 seconds
    act(() => {
        jest.advanceTimersByTime(1000);
    }); // count 2
    expect(screen.getByText(/Redirecting you in 2 seconds/i)).toBeInTheDocument();

    act(() => {
        jest.advanceTimersByTime(1000);
    }); // count 1
    expect(screen.getByText(/Redirecting you in 1 seconds/i)).toBeInTheDocument();

    act(() => {
        jest.advanceTimersByTime(1000);
    }); // count 0, navigate should be called
    expect(navigateMock).toHaveBeenCalledWith("/login", { state: "/current" });
  });

  it("uses a custom path if provided", async () => {
    const navigateMock = jest.fn();
    useNavigate.mockReturnValue(navigateMock);
    useLocation.mockReturnValue({ pathname: "/current" });

    render(<Spinner path="dashboard" />);
    act(() => {
        jest.advanceTimersByTime(3000);
    });
    expect(navigateMock).toHaveBeenCalledWith("/dashboard", { state: "/current" });
  });
});
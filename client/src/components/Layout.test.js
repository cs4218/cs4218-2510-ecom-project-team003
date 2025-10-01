import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";
import { MemoryRouter } from "react-router-dom";

jest.mock("./Header", () => () => <div data-testid="header" />);
jest.mock("./Footer", () => () => <div data-testid="footer" />);
jest.mock("react-hot-toast");

describe("Layout", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderLayout = (props) =>
        render(
            <MemoryRouter>
                <Layout {...props}>
                    <div data-testid="children"></div>
                </Layout>
            </MemoryRouter>
        );

    it("Renders Header, Footer and Children Components", () => {
        renderLayout();

        expect(screen.getByTestId("header")).toBeInTheDocument();
        expect(screen.getByTestId("footer")).toBeInTheDocument();
        expect(screen.getByTestId("children")).toBeInTheDocument();
    });
});
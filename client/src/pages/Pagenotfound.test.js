import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import Pagenotfound from "./Pagenotfound";

jest.mock("../components/Layout", () => ({ title, children }) => (
    <div data-testid="layout">
        <h1 data-testid="title">{title}</h1>
        {children}
    </div>
));

describe("Page Not Found's Page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderPageNotFound = () =>
        render(
            <MemoryRouter>
                <Pagenotfound />
            </MemoryRouter>
        );

    it("Renders Layout With Title", () => {
        renderPageNotFound();
        const layout = screen.getByTestId("layout");
        const title = screen.getByTestId("title");

        expect(layout).toBeInTheDocument();
        expect(title).toHaveTextContent("go back- page not found");
    });

    it("Renders Heading and Subheading", () => {
        renderPageNotFound();
        const heading = screen.getByText("404");
        const subheading = screen.getByText("Oops ! Page Not Found");

        expect(heading).toBeInTheDocument();
        expect(subheading).toBeInTheDocument();
    });

    it("Renders Back Link", () => {
        renderPageNotFound();
        const link = screen.getByRole("link", { name: "Go Back" });

        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute("href", "/");
    });
});
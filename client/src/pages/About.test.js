import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import About from "./About";

jest.mock("../components/Layout", () => ({ children, title }) => (
    <div data-testid="layout">
        <h1 data-testid="title">{title}</h1>
        {children}
    </div>
));

describe("About Page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderAbout = () => render(<About />);

    it("Renders Layout with Title", () => {
        renderAbout();
        const layout = screen.getByTestId("layout");
        const title = screen.getByTestId("title");

        expect(layout).toBeInTheDocument();
        expect(title).toHaveTextContent("About us - Ecommerce app");
    });

    it("Renders Image", () => {
        renderAbout();
        const img = screen.getByAltText("contactus");

        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "/images/about.jpeg");
        expect(img).toHaveStyle({ width: '100%' });
    });

    it("Renders Text", () => {
        renderAbout();
        const text = screen.getByText("Add text");

        expect(text).toBeInTheDocument();
    });
});
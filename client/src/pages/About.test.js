import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
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

    const renderAbout = () => render(
        <MemoryRouter>
            <About />
        </MemoryRouter>
    );

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
    });

    it("Renders Text", () => {
        renderAbout();
        const text = screen.getByText(
            "Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended."
        );

        expect(text).toBeInTheDocument();
    });
});
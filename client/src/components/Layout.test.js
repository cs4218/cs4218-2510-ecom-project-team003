import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";
import { MemoryRouter } from "react-router-dom";

jest.mock("./Header", () => () => <div data-testid="header" />);
jest.mock("./Footer", () => () => <div data-testid="footer" />);
jest.mock("react-hot-toast", () => ({ Toaster: () => <div data-testid="toaster" /> }));

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

    it("Renders Header, Footer, Toaster, and Children Components", () => {
        renderLayout();

        expect(screen.getByTestId("header")).toBeInTheDocument();
        expect(screen.getByTestId("footer")).toBeInTheDocument();
        expect(screen.getByTestId("toaster")).toBeInTheDocument();
        expect(screen.getByTestId("children")).toBeInTheDocument();
    });

    it("Renders default Helmet metadata", async () => {
        renderLayout();

        await waitFor(() => expect(document.title).toBe("Ecommerce app - shop now"));

        const metaDesc = document.querySelector('meta[name="description"]');
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        const metaAuthor = document.querySelector('meta[name="author"]');

        expect(metaDesc).toHaveAttribute("content", "mern stack project");
        expect(metaKeywords).toHaveAttribute("content", "mern,react,node,mongodb");
        expect(metaAuthor).toHaveAttribute("content", "Techinfoyt");
    });
});
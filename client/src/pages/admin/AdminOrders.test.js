import axios from "axios";
import React from "react";
import AdminOrders from "./AdminOrders";
import {MemoryRouter} from "react-router-dom";
import {act, fireEvent, render, screen, within} from "@testing-library/react";
import { LAPTOP, TABLET, STUDY_GUIDE, ELECTRONICS, BOOKS, USER, ADMIN } from "../../../tests/helpers/testData";

jest.mock("axios");
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()])
}));
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const renderAdminOrders = () => {
    render(
        <MemoryRouter>
            <AdminOrders />
        </MemoryRouter>
    );
}

describe("AdminOrders tests", () => {
    beforeEach(() => {
        // do some auth setting here
    })
})
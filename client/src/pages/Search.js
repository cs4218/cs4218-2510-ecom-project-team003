import React from "react";
import toast from "react-hot-toast";
import Layout from "./../components/Layout";
import { useSearch } from "../context/search";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import { getShortDescription } from "../utils/string";

const Search = () => {
  const [values] = useSearch();
  const navigate = useNavigate();
  const {addToCart} = useCart();

  // Safe access to results
  const results = values?.results || [];
  const resultCount = results.length;

  return (
    <Layout title={"Search results"}>
      <div className="container">
        <div className="text-center">
          <h1>Search Results</h1>
          <h6>
            {resultCount < 1
              ? "No Products Found"
              : `Found ${resultCount}`}
          </h6>
          <div className="d-flex flex-wrap mt-4">
            {results.map((p) => (
              <div className="card m-2" style={{ width: "18rem" }} key={p._id}>
                <img
                  src={`/api/v1/product/product-photo/${p._id}`}
                  className="card-img-top"
                  alt={p.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{p.name}</h5>
                  <p className="card-text">
                    {getShortDescription(p.description)}
                  </p>
                  <p className="card-text">
                    {p.price.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </p>
                  <button
                    className="btn btn-primary ms-1"
                    onClick={() => navigate(`/product/${p.slug}`)}>
                    More Details
                  </button>
                  <button
                    className="btn btn-secondary ms-1"
                    onClick={() => {
                      addToCart(p);
                      toast.success("Item added to cart");
                    }}>
                    ADD TO CART
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Search;
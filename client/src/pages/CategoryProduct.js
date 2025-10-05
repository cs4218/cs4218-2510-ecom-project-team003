import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Layout from "../components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/cart";
import "../styles/CategoryProductStyles.css";
import axios from "axios";
import { getShortDescription } from "../utils/string";

const formatResultCount = (count) => {
  count = count || 0;
  return count === 1 ? "1 result found" : `${count} results found`;
};

const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const {addToCart} = useCart();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);

  useEffect(() => {
    if (!params?.slug) return navigate('/pagenotfound');
    getPrductsByCat();
  }, [params?.slug]);
  const getPrductsByCat = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/product-category/${params.slug}`
      );

      if (!data?.category) {
        navigate('/pagenotfound');
        return;
      }

      setProducts(data?.products);
      setCategory(data?.category);
    } catch (error) {
      console.log(error);
      toast.error("Something when wrong while fetching category products");
    }
  };

  return (
    <Layout>
      <div className="container mt-3 category">
        <h4 className="text-center">Category - {category?.name}</h4>
        <h6 className="text-center">{formatResultCount(products?.length)}</h6>
        <div className="row">
          <div className="col-md-9 offset-1">
            <div className="d-flex flex-wrap">
              {products?.map((p) => (
                <div className="card m-2" key={p._id}>
                  <img
                    src={`/api/v1/product/product-photo/${p._id}`}
                    className="card-img-top"
                    alt={p.name}
                  />
                  <div className="card-body">
                    <div className="card-name-price">
                      <h5 className="card-title">{p.name}</h5>
                      <h5 className="card-title card-price">
                        {p.price.toLocaleString("en-US", {
                          style: "currency",
                          currency: "USD",
                        })}
                      </h5>
                    </div>
                    <p className="card-text ">
                      {getShortDescription(p.description)}
                    </p>
                    <div className="card-name-price">
                      <button
                        className="btn btn-info ms-1"
                        onClick={() => navigate(`/product/${p.slug}`)}
                      >
                        More Details
                      </button>
                      <button
                        className="btn btn-dark ms-1"
                        onClick={() => {
                          addToCart(p);
                          toast.success("Item added to cart");
                        }}
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;
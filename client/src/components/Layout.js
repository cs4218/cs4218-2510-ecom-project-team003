import React, { useEffect } from 'react'
import Footer from './Footer';
import Header from './Header';
import { Helmet } from "react-helmet";
import toast, { Toaster } from 'react-hot-toast';
import { useLocation } from "react-router-dom";

const Layout = ({ children, title, description, keywords, author }) => {
    const location = useLocation();

    // Dismiss toast on location change
    useEffect(() => {
        toast.dismiss();
    }, [location.pathname]);

    return (
    <div>
      <Helmet>
        <meta charSet="utf-8" />
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="author" content={author} />
        <title>{title}</title>
      </Helmet>
      <Header />
      <main style={{ minHeight: "70vh" }}>
        <Toaster />
        {children}
      </main>
      <Footer />
    </div>
  );
};

Layout.defaultProps = {
  title: "Ecommerce app - shop now",
  description: "mern stack project",
  keywords: "mern,react,node,mongodb",
  author: "Techinfoyt",
};

export default Layout;
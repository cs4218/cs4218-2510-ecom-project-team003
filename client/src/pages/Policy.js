import React from "react";
import Layout from "./../components/Layout";

const Policy = () => {
  return (
    <Layout title={"Privacy Policy"}>
      <div className="row contactus ">
        <div className="col-md-6 ">
          <img
            src="/images/contactus.jpeg"
            alt="contactus"
            style={{ width: "100%" }}
          />
        </div>
        <div className="col-md-4">
          <p>We collect only the data needed to manage your account and orders.</p>
          <p>Your information is stored securely and encrypted where possible.</p>
          <p>We never sell your personal data to third parties.</p>
          <p>We use cookies to improve the site and remember your preferences.</p>
          <p>You can access, update, or delete your data at any time.</p>
          <p>We share data only with trusted providers for payments and delivery.</p>
          <p>Contact us with any privacy questions or concerns.</p>
        </div>
      </div>
    </Layout>
  );
};

export default Policy;
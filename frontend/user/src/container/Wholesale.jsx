import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import client from "../api/client";

function Wholesale() {
  const formik = useFormik({
    initialValues: {
      name: "",
      company: "",
      address: "",
      email: "",
      city: "",
      phone: "",
      state: "",
      mobile: "",
      country: "",
      pincode: "",
      details: "",
    },

    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      company: Yup.string().required("Company name is required"),
      address: Yup.string().required("Address is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      city: Yup.string().required("City is required"),
      phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone must be 10 digits")
        .required("Phone number is required"),
      state: Yup.string().required("State is required"),
      mobile: Yup.string()
        .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
        .required("Mobile number is required"),
      country: Yup.string().required("Country is required"),
      pincode: Yup.string()
        .matches(/^[0-9]{6}$/, "Pincode must be 6 digits")
        .required("Pincode is required"),
      details: Yup.string().min(10, "Minimum 10 characters"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await client.post("/support/wholesale", values);
        console.log("Wholesale Form Data:", values);
        // alert("Form submitted successfully!");
        resetForm();
      } catch (err) {
        console.error("Submission error:", err);
        // alert("Failed to submit form. Please try again.");
      }
    },
  });

  return (
    <>
      <section className="z_wholesale_section">
        <Container>
          <div className="z_wholesale_head mb-4">
            <h2>PLACE YOUR BULK ORDER</h2>
            <span></span>
          </div>

          <Form onSubmit={formik.handleSubmit}>
            <Row className="gy-3">
              <Col md={6}>
                <Form.Control
                  name="name"
                  placeholder="Enter Name *"
                  className="z_wholesale_input"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.name && formik.errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.name}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="company"
                  placeholder="Enter Company Name *"
                  className="z_wholesale_input"
                  value={formik.values.company}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.company && formik.errors.company}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.company}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="address"
                  placeholder="Enter Address *"
                  className="z_wholesale_input"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.address && formik.errors.address}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.address}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="email"
                  type="email"
                  placeholder="Enter Email *"
                  className="z_wholesale_input"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.email && formik.errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.email}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="city"
                  placeholder="Enter City *"
                  className="z_wholesale_input"
                  value={formik.values.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.city && formik.errors.city}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.city}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="phone"
                  placeholder="Enter Phone Number *"
                  className="z_wholesale_input"
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.phone && formik.errors.phone}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.phone}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="state"
                  placeholder="Enter State *"
                  className="z_wholesale_input"
                  value={formik.values.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.state && formik.errors.state}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.state}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="mobile"
                  placeholder="Enter Mobile Number *"
                  className="z_wholesale_input"
                  value={formik.values.mobile}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.mobile && formik.errors.mobile}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.mobile}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Select
                  name="country"
                  className="z_wholesale_input"
                  value={formik.values.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.country && formik.errors.country}
                >
                  <option value="">Select your country</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {formik.errors.country}
                </Form.Control.Feedback>
              </Col>

              <Col md={6}>
                <Form.Control
                  name="pincode"
                  placeholder="Enter Pincode *"
                  className="z_wholesale_input"
                  value={formik.values.pincode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.pincode && formik.errors.pincode}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.pincode}
                </Form.Control.Feedback>
              </Col>

              <Col md={12}>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="details"
                  placeholder="Enter Details"
                  className="z_wholesale_input"
                  value={formik.values.details}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  isInvalid={formik.touched.details && formik.errors.details}
                />
                <Form.Control.Feedback type="invalid">
                  {formik.errors.details}
                </Form.Control.Feedback>
              </Col>

              <Col md={12} className="text-center mt-4">
                <Button type="submit" className="z_wholesale_btn">
                  Submit
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </section>

      {/* ================== STYLES ================== */}
      <style jsx="true">{`
        .row {
          --bs-gutter-x: 1.5rem !important;
        }

        .z_wholesale_section {
          padding: 60px 0;
        }

        .z_wholesale_head h2 {
          font-size: 20px;
          font-weight: 500;
          letter-spacing: 1px;
        }

        .z_wholesale_head span {
          display: block;
          width: 30px;
          height: 2px;
          background: #0a2845;
          margin-top: 6px;
        }

        .z_wholesale_input {
          border-radius: 0;
          padding: 12px 14px;
          font-size: 14px;
          border: 1px solid #dcdcdc;
        }

        .z_wholesale_input:focus {
          border-color: #0a2845;
          box-shadow: none;
        }

        .z_wholesale_btn {
          background: #0a2845;
          color: #fff;
          border: none;
          padding: 10px 28px;
          border-radius: 4px;
          font-size: 14px;
        }

        .z_wholesale_content {
          padding: 50px 0;
          border-top: 1px solid #eee;
        }

        .z_wholesale_content h5 {
          font-weight: 600;
          margin-bottom: 15px;
        }

        .z_wholesale_content h6 {
          margin-top: 20px;
          font-weight: 600;
        }

        .z_wholesale_content p,
        .z_wholesale_content li {
          font-size: 14px;
          color: #444;
          line-height: 1.7;
        }

        .z_wholesale_btn:focus,
        .z_wholesale_btn:active,
        .z_wholesale_btn:hover,
        .z_wholesale_btn:focus-visible {
          background: #0a2845 !important;
          box-shadow: none !important;
          outline: none !important;
          border: none !important;
        }

        /* Mobile */
        @media (max-width: 576px) {
          .z_wholesale_section {
            padding: 40px 10px;
          }
        }
      `}</style>
    </>
  );
}

export default Wholesale;

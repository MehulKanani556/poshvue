import React from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import client from "../api/client";
import { toast } from "react-toastify";

/* =============================
   STATIC COMPLAINT TYPES
============================== */
const COMPLAIN_TYPES = [
  "Order Related",
  "Payment Issue",
  "Delivery Issue",
  "Product Issue",
  "Return / Refund",
  "Other",
];

function Complain() {
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      mobile: "",
      orderNumber: "",
      subject: "",
      complaintType: "",
      message: "",
    },

    validationSchema: Yup.object({
      name: Yup.string().min(2).required("Name is required"),
      email: Yup.string().email().required("Email is required"),
      mobile: Yup.string()
        .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
        .required("Mobile is required"),
      orderNumber: Yup.string().required("Order number is required"),
      subject: Yup.string().min(3).required("Subject is required"),
      complaintType: Yup.string().required("Select complaint type"),
      message: Yup.string().min(10).required("Message is required"),
    }),

    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        setSubmitting(true);

        const payload = {
          name: values.name,
          email: values.email,
          mobile: values.mobile,
          orderNumber: values.orderNumber,
          subject: values.subject,
          complaintType: values.complaintType,
          message: values.message,
        };

        await client.post("/support/complaints", payload);

        toast.success("Complaint submitted successfully");
        resetForm();
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "❌ Failed to submit complaint"
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <section className="z_complain_section py-5">
      <Container>
        <Row className="align-items-center custom-gutter">
          <Col lg={7}>
            <h2 className="z_complain_title">SEND YOUR QUERY TO US</h2>
            <div className="z_complain_line" />

            <Form
              onSubmit={(e) => {
                e.preventDefault();

                if (!formik.isValid) {
                  const firstError = Object.values(formik.errors)[0];
                  toast.warning(firstError);
                  return;
                }

                formik.handleSubmit();
              }}
            >
              <Row className='custom-gutter'>
                <Col md={6} className="mb-3">
                  <Form.Control
                    name="name"
                    placeholder="Enter Name *"
                    {...formik.getFieldProps("name")}
                  />
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Control
                    name="email"
                    placeholder="Enter Email *"
                    {...formik.getFieldProps("email")}
                  />
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Control
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    name="mobile"
                    placeholder="Enter Mobile No *"
                    value={formik.values.mobile}
                    onChange={(e) => {
                      const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                      formik.setFieldValue("mobile", onlyNumbers);
                    }}
                    maxLength={10}
                  />
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Control
                    name="orderNumber"
                    placeholder="Enter Order Number *"
                    {...formik.getFieldProps("orderNumber")}
                  />
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Control
                    name="subject"
                    placeholder="Enter Subject *"
                    {...formik.getFieldProps("subject")}
                  />
                </Col>

                <Col md={6} className="mb-3">
                  <Form.Select
                    name="complaintType"
                    {...formik.getFieldProps("complaintType")}
                  >
                    <option value="">Select Complaint Type *</option>
                    {COMPLAIN_TYPES.map((type, i) => (
                      <option key={i} value={type}>
                        {type}
                      </option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={12} className="mb-4">
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="message"
                    placeholder="Enter Message *"
                    {...formik.getFieldProps("message")}
                  />
                </Col>

                <Col md={12}>
                  <Button
                    type="submit"
                    className="z_complain_btn w-100"
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </Col>
              </Row>
            </Form>
          </Col>

          <Col lg={5} className="text-center d-none d-lg-block">
            <img
              src="https://i.pinimg.com/736x/0d/f5/bf/0df5bfa5e44d8f65b117d07af063a0db.jpg"
              alt="Complaint"
              className="img-fluid"
              style={{ height: '390px' }}
            />
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default Complain;

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Nav,
  Tab,
  Form,
  Button,
  Table,
} from "react-bootstrap";
import { MdOutlineEdit } from "react-icons/md";
import { MdDeleteOutline } from "react-icons/md";
import { MdCamera } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import { MdContentCopy } from "react-icons/md";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Tooltip from "bootstrap/js/dist/tooltip";
import client from "../api/client";

function Profile() {
  const navigate = useNavigate();
  const [key, setKey] = useState("myProfile");
  // State to track which coupon's details are open
  const [openCouponIndex, setOpenCouponIndex] = useState(null);
  const [openOrderId, setOpenOrderId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const fileInputRef = useRef(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    type: "",
    name: "",
    mobile: "",
    address: "",
    pincode: "",
  });
  const [profile, setProfile] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = localStorage.getItem("userToken");

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await client.get("/auth/me");
        setProfile(res.data.user);
      } catch (err) {
        console.error("Profile fetch failed", err);
      }
    };

    fetchProfile();
  }, []);

  /* ================= FETCH ORDERS ================= */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // 🔹 userInfo localStorage mathi lo
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));

        console.log(userInfo,'userInfo')
  
        if (!userInfo?._id) {
          console.error("User not logged in");
          return;
        }
  
        const userId = userInfo._id;
  
        // 🔹 API call with userId
        const res = await client.get(`/commerce/orders/${userId}`);
        console.log(res,'resgtr')
        // Backend returns { item: [...] } from orderController.js
        setOrders(res.data.item ? res.data : res.data.items ? { item: res.data.items } : res.data);
      } catch (err) { 
        console.error("Orders fetch failed", err);
      }
    };
  
    fetchOrders();
  }, []);
  

  // Fetch addresses once when user opens Addresses tab
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await client.get("/address");
        console.log("Address API response:", res.data);
        setAddresses(res.data);
      } catch (err) {
        console.error("Failed to fetch addresses", err);
      }
    };

    if (key === "myAddresses" && addresses.length === 0) {
      console.log("Fetching addresses for tab myAddresses");
      fetchAddresses();
    }
  }, [key]);

  // Log whenever addresses state actually changes
  useEffect(() => {
    console.log("Addresses state changed:", addresses);
  }, [addresses]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await client.get("/commerce/coupons", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCoupons(res.data);
      } catch (err) {
        console.error("Failed to fetch coupons", err);
        console.log("STATUS:", err?.response?.status);
        console.log("DATA:", err?.response?.data);
      }
    };

    fetchCoupons();
  }, []);

  /* ================= IMAGE CHANGE ================= */
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfile({ ...profile, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const initializeTooltips = () => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]'
      );
      tooltipTriggerList.forEach(
        (tooltipTriggerEl) => new Tooltip(tooltipTriggerEl)
      );
    };

    // Delay to ensure items are rendered
    setTimeout(initializeTooltips, 100);
  }, [orders]); // re-run when orders change

  const [coupons, setCoupons] = useState([]);

  const handlePasswordInput = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const validatePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword)
      return "All fields are required";

    if (newPassword.length < 6)
      return "New password must be at least 6 characters";

    if (newPassword !== confirmPassword) return "Passwords do not match";

    if (currentPassword === newPassword)
      return "New password must be different from current password";

    return "";
  };

  const validateProfile = () => {
    if (!profile.name.trim()) return "Name is required";
    if (!/\S+@\S+\.\S+/.test(profile.email)) return "Invalid email";
    if (!/^[0-9]{10}$/.test(profile.phone)) return "Phone must be 10 digits";
    if (profile.dob && new Date(profile.dob) > new Date())
      return "DOB cannot be in future";

    return "";
  };
  const validateAddress = () => {
    if (!addressForm.type.trim()) return "Address type required";
    if (!addressForm.name.trim()) return "Name required";
    if (!/^[0-9]{10}$/.test(addressForm.mobile))
      return "Mobile must be 10 digits";
    if (addressForm.address.trim().length < 10) return "Address too short";
    if (!/^[0-9]{6}$/.test(addressForm.pincode))
      return "Pincode must be 6 digits";

    return "";
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    const error = validatePassword();
    if (error) {
      alert(error);
      return;
    }

    try {
      setPasswordLoading(true);

      await client.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      // alert("Password updated successfully ✅");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      alert(err.response?.data?.message || "Password update failed ❌");
    } finally {
      setPasswordLoading(false);
    }
  };

  const toggleCouponDetails = (index) => {
    setOpenCouponIndex(openCouponIndex === index ? null : index);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressForm({ ...addressForm, [name]: value });
  };

  const handleAddOrUpdateAddress = async (e) => {
    e.preventDefault();

    const error = validateAddress();
    if (error) {
      alert(error);
      return;
    }

    try {
      if (editId) {
        // UPDATE
        await client.put(`/address/${editId}`, addressForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // alert("Address updated ✅");
      } else {
        // CREATE
        await client.post("/address/add", addressForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // alert("Address added ✅");
      }

      // FETCH latest addresses once
      const res = await client.get("/address", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data);

      // Reset form
      setAddressForm({ type: "", name: "", mobile: "", address: "", pincode: "" });
      setEditId(null);
      setShowAddressForm(false);
    } catch (err) {
      // alert("Failed to save address ❌");
      console.error(err);
    }
  };

  const handleEditAddress = (addr) => {
    setEditId(addr._id);
    setAddressForm(addr);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    try {
      await client.delete(`/address/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update addresses locally without extra GET
      setAddresses(addresses.filter((addr) => addr._id !== id));
      // alert("Address deleted ✅");
    } catch (err) {
      // alert("Failed to delete address ❌");
      console.error(err);
    }
  };

  const handleViewOrderDetails = (orderId) => {
    setOpenOrderId(openOrderId === orderId ? null : orderId);
  };

  const handleLogout = async () => {
    try {
      await client.post("/auth/logout");
    } catch (err) {
      // ignore errors
    }
    localStorage.removeItem("userToken");
    localStorage.removeItem("userInfo");
    navigate("/");
  };
  console.log("COUPONS:", coupons);
  console.log("orders:", orders);
  return (
    <>
      <section className="z_prof_section py-5">
        <Container>
          <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
            <Row>
              {/* Sidebar Nav */}
              <Col lg={3} className="mb-md-4">
                <Nav variant="pills" className="flex-column z_prof_nav">
                  <Nav.Item>
                    <Nav.Link eventKey="myProfile">My Profile</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="myOrders">My Orders</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="myCoupons">My Coupons</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="myAddresses">Addresses</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="changePassword">
                      Change Password
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="logout">Logout</Nav.Link>
                  </Nav.Item>
                </Nav>
              </Col>

              {/* Tab Content */}
              <Col lg={9}>
                <Tab.Content className="z_prof_tab_content">
                  {/* My Profile */}
                  <Tab.Pane eventKey="myProfile">
                    <div className="z_prof_card p-4">
                      <h4 className="z_prof_title mb-3">My Profile</h4>
                      <div className="text-center mb-3 w-auto">
                        {profile.image ? (
                          <img
                            src={profile.image}
                            alt="Profile"
                            className="rounded-circle"
                            style={{
                              width: "100px",
                              height: "100px",
                              cursor: "pointer",
                              objectFit: "cover",
                            }}
                            onClick={() => fileInputRef.current.click()}
                          />
                        ) : (
                          <MdCamera
                            size={50}
                            style={{ color: "#ccc", cursor: "pointer" }}
                            onClick={() => fileInputRef.current.click()}
                          />
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </div>
                      <Form onSubmit={handlePasswordChange}>
                        <Form.Group className="mb-3">
                          <Form.Label>Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={profile.name}
                            onChange={(e) =>
                              setProfile({ ...profile, name: e.target.value })
                            }
                            disabled={!isEditMode}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            value={profile.email}
                            onChange={(e) =>
                              setProfile({ ...profile, email: e.target.value })
                            }
                            disabled={!isEditMode}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            value={profile.phone}
                            onChange={(e) =>
                              setProfile({ ...profile, phone: e.target.value })
                            }
                            disabled={!isEditMode}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Date of Birth</Form.Label>
                          <Form.Control
                            type="date"
                            value={profile.dob}
                            onChange={(e) =>
                              setProfile({ ...profile, dob: e.target.value })
                            }
                            disabled={!isEditMode}
                          />
                        </Form.Group>
                        <button
                          className="z_cart_empty_btn d-flex align-items-center gap-2"
                          onClick={() => {
                            if (isEditMode) {
                              const error = validateProfile();
                              if (error) {
                                alert(error);
                                return;
                              }
                            }
                            setIsEditMode(!isEditMode);
                          }}
                        >
                          {!isEditMode && <MdOutlineEdit size={20} />}
                          {isEditMode ? "Update Profile" : ""}
                        </button>
                      </Form>
                    </div>
                  </Tab.Pane>

                  {/* My Orders */}
                  <Tab.Pane eventKey="myOrders">
  <div className="z_prof_card p-4">
    <h4 className="z_prof_title mb-4">My Orders</h4>

    <div className="z_orders_timeline">
      {orders?.item?.map((order, index) => (
        <div key={order._id} className="z_order_timeline_item">
          
          {/* Timeline Marker */}
          <div className="z_order_marker">
            <span
              className={`z_order_dot ${order.status?.toLowerCase()}`}
            ></span>

            {index !== orders.item.length - 1 && (
              <span className="z_order_line"></span>
            )}
          </div>

          {/* Order Content */}
          <div className="z_order_content">
            <div className="z_order_id_status">
              <span className="z_order_id">
                Order ID: #{order._id.slice(-6)}
                <MdContentCopy 
                  size={16} 
                  className="ms-2" 
                  style={{ cursor: 'pointer', color: '#666' }}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(order._id);
                      alert('Order ID copied to clipboard!');
                    } catch (err) {
                      console.error('Failed to copy:', err);
                      alert('Failed to copy Order ID');
                    }
                  }}
                  title="Copy full Order ID"
                />
              </span>

              <span
                className={`z_order_status ${order.status?.toLowerCase()}`}
              >
                {order.status}
              </span>
            </div>

            <div className="z_order_details">
              <span>
                <strong>Date:</strong>{" "}
                {new Date(order.createdAt).toLocaleDateString()}
              </span>

              <span>
                <strong>Amount:</strong> ₹{order.total}
              </span>
              
              {order.paymentMethod && (
                <span>
                  <strong>Payment:</strong> {order.paymentMethod.toUpperCase()}
                </span>
              )}
            </div>

            {order.trackingNumber && (
              <div className="z_order_tracking mt-2">
                <strong>Tracking Number:</strong> {order.trackingNumber}
                {order.trackingUrl && (
                  <a 
                    href={order.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ms-2"
                    style={{ textDecoration: 'underline' }}
                  >
                    Track Order
                  </a>
                )}
              </div>
            )}

            <div className="mt-2 d-flex gap-2 flex-wrap">
              <Button
                className="z_order_btn"
                onClick={() => handleViewOrderDetails(order._id)}
              >
                {openOrderId === order._id
                  ? "Hide Details"
                  : "View Details"}
              </Button>
              <Button
               className="z_track_btn"
                size="sm"
                onClick={() => navigate("/TrackOrder")}
              >
                Track Order
              </Button>
            </div>
          </div>

          {/* Order Details Box */}
          {openOrderId === order._id && (
            <div className="z_order_details_box mt-3">
              <div className="mb-3">
                <p>
                  <strong>Delivery Address:</strong>{" "}
                  {order.address || "N/A"}
                </p>
                
                {order.paymentStatus && (
                  <p>
                    <strong>Payment Status:</strong>{" "}
                    <span className={`badge ${
                      order.paymentStatus === 'completed' ? 'bg-success' : 
                      order.paymentStatus === 'pending' ? 'bg-warning' : 
                      'bg-danger'
                    }`}>
                      {order.paymentStatus}
                    </span>
                  </p>
                )}
              </div>

              <div className="z_table_scroll">
                <Table bordered size="sm" className="mt-2">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Price</th>
                    </tr>
                  </thead>

                  <tbody>
                    {order.items?.map((item, i) => (
                      <tr key={i}>
                        <td>
                          {item.name}
                          {item.size && ` (Size: ${item.size})`}
                          {item.color && ` (Color: ${item.color})`}
                        </td>
                        <td>{item.qty || item.quantity}</td>
                        <td>₹{item.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              <div className="text-end fw-bold">
                Total: ₹{order.total}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* No Orders */}
      {orders?.item?.length === 0 && (
        <p className="text-center text-muted">No orders found</p>
      )}
    </div>
  </div>
</Tab.Pane>


                  {/* My Coupons */}
                  <Tab.Pane eventKey="myCoupons">
                    <div className="z_prof_card p-4">
                      <h4 className="z_prof_title mb-3">My Coupons</h4>
                      <ul className="z_prof_coupon_list">
                        {coupons?.items?.map((c, index) => (
                          <li key={c._id}>
                            <div className="z_coupon_header">
                              {c.discountType === "percent"
                                ? `${c.amount}% OFF`
                                : `$${c.amount} OFF`}
                            </div>

                            <div className="z_coupon_offer">
                              Use code & save instantly
                            </div>

                            <div className="z_coupon_code">Code: {c.code}</div>

                            {openCouponIndex === index && (
                              <div className="z_coupon_expiry">
                                Expiry:{" "}
                                {c.endDate
                                  ? new Date(c.endDate).toDateString()
                                  : "No Expiry"}
                              </div>
                            )}

                            <span
                              className="z_coupon_details"
                              onClick={() => toggleCouponDetails(index)}
                            >
                              {openCouponIndex === index
                                ? "Hide Details"
                                : "Details"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Tab.Pane>

                  {/* Addresses */}
                  <Tab.Pane eventKey="myAddresses">
                    <div className="z_prof_card p-4">
                      <h4 className="z_prof_title mb-3">Addresses</h4>

                      <ul className="z_prof_address_list">
                        {addresses?.map((addr) => (
                          <li key={addr._id} className="mb-3">
                            <div className="d-flex justify-content-between align-items-center z_prof_address_item">
                              <div>
                                <strong>{addr.type}:</strong> {addr.address}
                                <br />
                                <small>
                                  {addr.name} | {addr.mobile} | Pincode: {addr.pincode}
                                </small>
                              </div>
                              <div className="mt-2 d-flex gap-2">
                                <button
                                  className="z_outline_btn z_outline_edit z_icon_btn"
                                  onClick={() => handleEditAddress(addr)}
                                >
                                  <MdOutlineEdit size={20} />
                                  <span className="z_btn_text">Edit</span>
                                </button>

                                <button
                                  className="z_outline_btn z_outline_delete z_icon_btn"
                                  onClick={() => handleDeleteAddress(addr._id)}
                                >
                                  <MdDeleteOutline size={20} />
                                  <span className="z_btn_text">Delete</span>
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>

                      <button
                        className="z_cart_empty_btn"
                        onClick={() => {
                          setShowAddressForm(true);
                          setEditId(null);
                          setAddressForm({
                            type: "",
                            name: "",
                            mobile: "",
                            address: "",
                            pincode: "",
                          });
                        }}
                      >
                        Add New Address
                      </button>

                      {/* Address Form */}
                      {showAddressForm && (
                        <Form
                          className="mt-4"
                          onSubmit={handleAddOrUpdateAddress}
                        >
                          <Form.Group className="mb-3">
                            <Form.Label>Address Type</Form.Label>
                            <Form.Control
                              type="text"
                              name="type"
                              placeholder="Home / Office"
                              value={addressForm.type}
                              onChange={handleAddressChange}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={addressForm.name}
                              onChange={handleAddressChange}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Mobile</Form.Label>
                            <Form.Control
                              type="tel"
                              name="mobile"
                              value={addressForm.mobile}
                              onChange={handleAddressChange}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Full Address</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={3}
                              name="address"
                              value={addressForm.address}
                              onChange={handleAddressChange}
                              required
                            />
                          </Form.Group>

                          <Form.Group className="mb-3">
                            <Form.Label>Pincode</Form.Label>
                            <Form.Control
                              type="text"
                              name="pincode"
                              placeholder="Enter 6 digit pincode"
                              value={addressForm.pincode}
                              onChange={handleAddressChange}
                              maxLength={6}
                              required
                            />
                          </Form.Group>

                          <button type="submit" className="z_cart_empty_btn me-2">
                            {editId ? "Update Address" : "Save Address"}
                          </button>

                          <Button
                            variant="secondary"
                            onClick={() => setShowAddressForm(false)}
                          >
                            Cancel
                          </Button>
                        </Form>
                      )}
                    </div>
                  </Tab.Pane>

                  {/* Change Password */}
                  <Tab.Pane eventKey="changePassword">
                    <div className="z_prof_card p-4">
                      <h4 className="z_prof_title mb-3">Change Password</h4>

                      <Form onSubmit={handlePasswordChange}>
                        <Form.Group className="mb-3">
                          <Form.Label>Current Password</Form.Label>
                          <div style={{ position: "relative", width: "100%" }}>
                            <Form.Control
                              type={showCurrentPassword ? "text" : "password"}
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordInput}
                              style={{ paddingRight: "36px" }}
                            />
                            <span
                              onClick={() => setShowCurrentPassword((p) => !p)}
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {showCurrentPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </span>
                          </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <div style={{ position: "relative", width: "100%" }}>
                            <Form.Control
                              type={showNewPassword ? "text" : "password"}
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordInput}
                              style={{ paddingRight: "36px" }}
                            />
                            <span
                              onClick={() => setShowNewPassword((p) => !p)}
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </span>
                          </div>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password</Form.Label>
                          <div style={{ position: "relative", width: "100%" }}>
                            <Form.Control
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordInput}
                              style={{ paddingRight: "36px" }}
                            />
                            <span
                              onClick={() => setShowConfirmPassword((p) => !p)}
                              style={{
                                position: "absolute",
                                right: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                cursor: "pointer",
                                color: "#666",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                            </span>
                          </div>
                        </Form.Group>

                        <button
                          className="z_cart_empty_btn"
                          type="submit"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? "Updating..." : "Update Password"}
                        </button>
                      </Form>
                    </div>
                  </Tab.Pane>

                  {/* Logout */}
                  <Tab.Pane eventKey="logout">
                    <div className="z_prof_card p-4">
                      <h4 className="z_prof_title mb-3">Logout</h4>
                      <p>Click below to logout from your account.</p>
                      <button
                        type="button"
                        className="z_cart_empty_btn"
                        onClick={handleLogout}
                      >
                        Logout
                      </button>
                    </div>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Container>
      </section>

      <style jsx="true">
        {`
          .row {
            --bs-gutter-x: 1.5rem !important;
          }
        `}
      </style>
    </>
  );
}

export default Profile;

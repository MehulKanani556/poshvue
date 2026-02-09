import React, { useState, useEffect } from "react";
import { Breadcrumb } from "react-bootstrap";
import "../styles/h_style.css";
import client from "../api/client";
import Loader from "./Loader";

const PrivacyPolicy = () => {
	const [privacyPolicy, setPrivacyPolicy] = useState({
         title: 'Privacy Policy',
         subtitle: 'Your privacy is important to us. Please read this policy carefully.',
         sections: [
			{
				title: 'Use of Personal Information',
				content: `We collect personally identifiable information from visitors to our
					website. This may include name, email address, postal address with
					pincode, shipping and billing address, login ID, password, and contact
					number when you register, place an order, or request our services.
					We may also collect information such as IP address, browser type,
					location, visited pages, and advertisements clicked to improve the
					quality and performance of our website.`
			},
			{
				title: 'Non-Personal Information',
				content: `Non-personal information that does not identify individual users may be
					collected to analyze trends, administer the website, track user
					movements, and improve overall user experience. This data is used
					internally and is not shared with third parties.`
			},
			{
				title: 'Cookies & Tracking Technologies',
				content: `Our website may use cookies and similar tracking technologies to enhance
					your browsing experience, remember preferences, and understand user
					behavior. You may choose to disable cookies through your browser
					settings; however, this may affect certain features of the website.`
			},
			{
				title: 'Customer Reviews & Testimonials',
				content: `Customer reviews, feedback, and testimonials submitted on our website
					may contain personal information and may be publicly displayed. If you
					wish to remove or update your review, you may contact our customer
					support team.`
			},
			{
				title: 'Card Information & Payment Security',
				content: `All payments are securely processed through trusted third-party payment
					gateways. We do not store, process, or retain card or banking details.
					Payment data is protected using industry-standard encryption and fraud
					prevention practices.`
			},
			{
				title: 'Third-Party Services',
				content: `We may share limited information with logistics partners, payment
					providers, and service vendors strictly for order fulfillment and
					operational purposes. These third parties are obligated to protect your
					information and use it only for intended purposes.`
			},
			{
				title: 'Service Communication',
				content: `We may send service-related notifications such as order confirmations,
					delivery updates, and important account information via email or SMS.
					Promotional communication is sent only if you have opted in, and you may
					opt out at any time.`
			},
			{
				title: 'Data Security',
				content: `We implement reasonable administrative, technical, and physical security
					measures to safeguard your personal information against unauthorized
					access, misuse, loss, or disclosure.`
			},
			{
				title: 'Legal Disclosure',
				content: `We may disclose personal information when required by law, regulation,
					court order, or government request, or when disclosure is necessary to
					protect our legal rights and interests.`
			},
			{
				title: 'Changes to This Policy',
				content: `We reserve the right to update or modify this Privacy Policy at any time.
					Any changes will be effective immediately upon posting on this page.`
			},
			{
				title: 'User Consent & Agreement',
				content: `By accessing or using this website, you acknowledge that you have read,
					understood, and agreed to this Privacy Policy. If you do not agree, please
					discontinue use of our services.`
			}
         ]
     });
     const [loading, setLoading] = useState(true);

     useEffect(() => {
		(async function fetchPrivacyPolicy() {
			try {
				const res = await client.get("/privacy-policy");
				if (res && res.data && res.data.sections && res.data.sections.length > 0) {
					setPrivacyPolicy(res.data);
				}
			} catch (err) {
				console.error("Error fetching privacy policy:", err);
			} finally {
				setLoading(false);
			}
		})();
     }, []);

	if (loading) {
		return (
			<Loader fullScreen  text="Loading Data..." />
		);
	}

	return (
		<div className="terms-page bg-light">
			<div className="container py-5">

				{/* Breadcrumb */}
				<Breadcrumb className="align-items-center mb-4 terms-breadcrumb">
					<Breadcrumb.Item href="/" className="fw-medium text-dark">
						Home
					</Breadcrumb.Item>

					<span className="mx-2 text-muted d-flex align-items-center">/</span>

					<Breadcrumb.Item active className="fw-medium text-dark">
						{privacyPolicy.title}
					</Breadcrumb.Item> 
				</Breadcrumb>

				{/* Header */}
				<div className="terms-header mb-4">
					<h2 className="fw-bold">{privacyPolicy.title}</h2>
					<p className="text-muted mb-0">
						{privacyPolicy.subtitle}
					</p>
				</div>

				{/* Content */}
				<div className="terms-card py-3 py-md-4">
					<div className="terms-content">
						{privacyPolicy.sections.map((section, index) => (
							<div key={index}>
								<h5 className="terms-title">{section.title}</h5>
								<p>{section.content}</p>
							</div>
						))}
					</div>
				</div>

			</div>
		</div>
	);
};

export default PrivacyPolicy;
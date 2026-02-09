import React, { useState, useEffect } from "react";
import { Breadcrumb } from "react-bootstrap";
import "../styles/h_style.css";
import client from "../api/client";
import Loader from "./Loader";

const TermAndConditions = () => {
	const [termsData, setTermsData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		(async function fetchTermsData() {
			try {
				const res = await client.get("/terms-conditions"); // client.baseURL -> http://localhost:5000/api
				if (res && res.data) setTermsData(res.data);
			} catch (err) {
				console.error("Error fetching terms and conditions:", err);
				setError(err?.response?.data?.message || err.message);
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

	if (error) {
		return (
			<div className="terms-page bg-light">
				<div className="container py-5 text-center">
					<div className="alert alert-danger">
						<p className="mb-0">Error loading terms and conditions: {error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (!termsData) {
		return (
			<div className="terms-page bg-light">
				<div className="container py-5 text-center">
					<div className="alert alert-info">
						<p className="mb-0">No terms and conditions data available.</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="terms-page bg-light">
			<div className="container  py-md-3 py-0">

				{/* Breadcrumb */}
				<Breadcrumb className="align-items-center mb-4 terms-breadcrumb">
					<Breadcrumb.Item href="/" className="fw-medium text-dark">
						Home
					</Breadcrumb.Item>

					<span className="mx-2 text-muted d-flex align-items-center">/</span>

					<Breadcrumb.Item active className="fw-medium text-dark">
						Terms & Conditions
					</Breadcrumb.Item>
				</Breadcrumb>

				{/* Header */}
				<div className="terms-header mb-4">
					<h2 className="fw-bold">{termsData.title || 'Terms & Conditions'}</h2>
					<p className="text-muted mb-0">
						{termsData.subtitle || 'Please read these terms carefully before using our website.'}
					</p>
				</div>

				{/* Content Card */}
				<ul className="terms-list py-3 py-md-4">
					{termsData.points && termsData.points.map((point, index) => (
						<li key={index}>
							{point.text}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
};

export default TermAndConditions;

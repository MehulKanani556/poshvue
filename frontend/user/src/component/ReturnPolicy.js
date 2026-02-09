import React, { useState, useEffect } from "react";
import { Breadcrumb } from "react-bootstrap";
import "../styles/h_style.css";
import client from "../api/client";
import Loader from "./Loader";

const ReturnPolicy = () => {
	const [returnData, setReturnData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchReturnData();
	}, []);

	const fetchReturnData = async () => {
		try {
			const res = await client.get("/return-policy");
			if (res && res.data) setReturnData(res.data);
		} catch (error) {
			console.error('Error fetching return policy:', error);
			setError(error.message);
		} finally {
			setLoading(false);
		}
	};

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
						<p className="mb-0">Error loading return policy: {error}</p>
					</div>0
				</div>
			</div>
		);
	}

	if (!returnData) {
		return (
			<div className="terms-page bg-light">
				<div className="container py-5 text-center">
					<div className="alert alert-info">
						<p className="mb-0">No return policy data available.</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="terms-page bg-light">
			<div className="container py-md-3 py-0">

				{/* Breadcrumb */}
				<Breadcrumb className="align-items-center mb-4 terms-breadcrumb">
					<Breadcrumb.Item href="/" className="fw-medium text-dark">
						Home
					</Breadcrumb.Item>
					<span className="mx-2 text-muted">/</span>
					<Breadcrumb.Item active className="fw-medium text-dark">
						Return Policy
					</Breadcrumb.Item>
				</Breadcrumb>

				{/* Header */}
				<div className="terms-header mb-4">
					<h2 className="fw-bold">{returnData.title || 'Return, Refund & Cancellation Policy'}</h2>
					<p className="text-muted mb-0">
						{returnData.subtitle || 'Please read the following policy carefully before placing an order.'}
					</p>
				</div>

				{/* Content */}
				<div className="terms-card py-4">
					<div className="terms-content">
						{returnData.sections && returnData.sections.map((section, index) => (
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

export default ReturnPolicy;

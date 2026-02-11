import React, { useState } from "react";
import { FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from "react-icons/fi";

/**
 * RuleGenerator Component
 * Provides a user-friendly UI to build structured coupon rules
 * Rules are stored as JSON and can be used server-side for validation
 */
function RuleGenerator({ initialRules = [], onChange }) {
  const [rules, setRules] = useState(initialRules || []);
  const [expandedRuleIdx, setExpandedRuleIdx] = useState(null);

  const RULE_TYPES = [
    {
      value: "minSubtotal",
      label: "Minimum Subtotal",
      desc: "Require minimum cart value",
    },
    {
      value: "minQuantity",
      label: "Minimum Quantity",
      desc: "Require minimum qty of a product",
    },
    {
      value: "allowedCategories",
      label: "Allowed Categories",
      desc: "Only for specific categories",
    },
    {
      value: "excludedCategories",
      label: "Excluded Categories",
      desc: "Exclude specific categories",
    },
    {
      value: "requiredProducts",
      label: "Required Products",
      desc: "Cart must contain specific products",
    },
    {
      value: "firstTimeUser",
      label: "First-Time User Only",
      desc: "Valid only for new customers",
    },
    {
      value: "maxUsesPerUser",
      label: "Max Uses Per User",
      desc: "Limit coupon uses per customer",
    },
    {
      value: "minOrder",
      label: "Minimum Orders",
      desc: "User must have placed at least N orders",
    },
    {
      value: "maxOrder",
      label: "Maximum Orders",
      desc: "User must have placed less than N orders",
    },
    {
      value: "dateRange",
      label: "Date Range",
      desc: "Coupon valid within date range",
    },
  ];

  function addRule() {
    const newRule = { type: "minSubtotal", value: 0 };
    const updated = [...rules, newRule];
    setRules(updated);
    onChange(updated);
  }

  function removeRule(idx) {
    const updated = rules.filter((_, i) => i !== idx);
    setRules(updated);
    onChange(updated);
  }

  function updateRule(idx, field, val) {
    const updated = [...rules];
    updated[idx] = { ...updated[idx], [field]: val };
    setRules(updated);
    onChange(updated);
  }

  function toggleExpand(idx) {
    setExpandedRuleIdx(expandedRuleIdx === idx ? null : idx);
  }

  return (
    <div
      style={{
        marginTop: "20px",
        padding: "15px",
        backgroundColor: "#f9f9f9",
        borderRadius: "4px",
        border: "1px solid #e0e0e0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
          Structured Rules (Optional)
        </h3>
        <button
          type="button"
          className="x_btn x_btn-sm x_btn-primary"
          onClick={addRule}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <FiPlus size={14} /> Add Rule
        </button>
      </div>

      {rules.length === 0 && (
        <p style={{ color: "#999", fontSize: "13px", marginBottom: 0 }}>
          No rules yet. Click "Add Rule" to create structured rules for this
          coupon.
        </p>
      )}

      {rules.map((rule, idx) => {
        const ruleType = RULE_TYPES.find((r) => r.value === rule.type);
        const isExpanded = expandedRuleIdx === idx;

        return (
          <div
            key={idx}
            style={{
              marginBottom: "10px",
              padding: "12px",
              backgroundColor: "#fff",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
              }}
              onClick={() => toggleExpand(idx)}
            >
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 3px 0",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {ruleType?.label || "Unknown"}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
                  {ruleType?.desc || ""}
                </p>
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  type="button"
                  className="x_btn x_btn-sm btn_remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRule(idx);
                  }}
                  title="Remove"
                >
                  <FiTrash2 size={14} />
                </button>
                {isExpanded ? (
                  <FiChevronUp size={16} style={{ color: "#666" }} />
                ) : (
                  <FiChevronDown size={16} style={{ color: "#666" }} />
                )}
              </div>
            </div>

            {isExpanded && (
              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid #eee",
                }}
              >
                <div className="x_form-group" style={{ marginBottom: "10px" }}>
                  <label className="x_form-label" style={{ fontSize: "12px" }}>
                    Rule Type
                  </label>
                  <select
                    className="x_form-select"
                    value={rule.type}
                    onChange={(e) => updateRule(idx, "type", e.target.value)}
                  >
                    {RULE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rule-specific fields */}
                {rule.type === "minSubtotal" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      Minimum Amount
                    </label>
                    <input
                      type="number"
                      className="x_form-control"
                      value={rule.value || 0}
                      onChange={(e) =>
                        updateRule(idx, "value", Number(e.target.value))
                      }
                      placeholder="e.g., 100000"
                    />
                  </div>
                )}

                {rule.type === "minQuantity" && (
                  <>
                    <div
                      className="x_form-group"
                      style={{ marginBottom: "10px" }}
                    >
                      <label
                        className="x_form-label"
                        style={{ fontSize: "12px" }}
                      >
                        Product ID
                      </label>
                      <input
                        type="text"
                        className="x_form-control"
                        value={rule.productId || ""}
                        onChange={(e) =>
                          updateRule(idx, "productId", e.target.value)
                        }
                        placeholder="Paste product ID here"
                      />
                    </div>
                    <div
                      className="x_form-group"
                      style={{ marginBottom: "10px" }}
                    >
                      <label
                        className="x_form-label"
                        style={{ fontSize: "12px" }}
                      >
                        Required Quantity
                      </label>
                      <input
                        type="number"
                        className="x_form-control"
                        value={rule.value || 1}
                        onChange={(e) =>
                          updateRule(idx, "value", Number(e.target.value))
                        }
                        placeholder="e.g., 2"
                      />
                    </div>
                  </>
                )}

                {rule.type === "allowedCategories" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      Allowed Category IDs (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="x_form-control"
                      value={(rule.categories || []).join(", ")}
                      onChange={(e) => {
                        const cats = e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter((c) => c);
                        updateRule(idx, "categories", cats);
                      }}
                      placeholder="e.g., 60e5a123abc, 60e5a456def"
                    />
                  </div>
                )}

                {rule.type === "excludedCategories" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      Excluded Category IDs (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="x_form-control"
                      value={(rule.categories || []).join(", ")}
                      onChange={(e) => {
                        const cats = e.target.value
                          .split(",")
                          .map((c) => c.trim())
                          .filter((c) => c);
                        updateRule(idx, "categories", cats);
                      }}
                      placeholder="e.g., 60e5a789ghi"
                    />
                  </div>
                )}

                {rule.type === "requiredProducts" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      Required Product IDs (comma-separated)
                    </label>
                    <input
                      type="text"
                      className="x_form-control"
                      value={(rule.products || []).join(", ")}
                      onChange={(e) => {
                        const prods = e.target.value
                          .split(",")
                          .map((p) => p.trim())
                          .filter((p) => p);
                        updateRule(idx, "products", prods);
                      }}
                      placeholder="e.g., 60e5a123abc, 60e5a456def"
                    />
                  </div>
                )}

                {rule.type === "firstTimeUser" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      <input
                        type="checkbox"
                        checked={rule.value || false}
                        onChange={(e) =>
                          updateRule(idx, "value", e.target.checked)
                        }
                        style={{ marginRight: "8px" }}
                      />
                      Apply only to first-time users
                    </label>
                  </div>
                )}

                {rule.type === "maxUsesPerUser" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      Max Uses Per User
                    </label>
                    <input
                      type="number"
                      className="x_form-control"
                      value={rule.value || 1}
                      onChange={(e) =>
                        updateRule(idx, "value", Number(e.target.value))
                      }
                      placeholder="e.g., 3"
                    />
                  </div>
                )}

                {rule.type === "minOrder" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      Minimum Order Count
                    </label>
                    <input
                      type="number"
                      className="x_form-control"
                      value={rule.value || 0}
                      onChange={(e) =>
                        updateRule(idx, "value", Number(e.target.value))
                      }
                      placeholder="e.g., 2"
                    />
                  </div>
                )}

                {rule.type === "maxOrder" && (
                  <div
                    className="x_form-group"
                    style={{ marginBottom: "10px" }}
                  >
                    <label
                      className="x_form-label"
                      style={{ fontSize: "12px" }}
                    >
                      Maximum Order Count
                    </label>
                    <input
                      type="number"
                      className="x_form-control"
                      value={rule.value || 0}
                      onChange={(e) =>
                        updateRule(idx, "value", Number(e.target.value))
                      }
                      placeholder="e.g., 5"
                    />
                  </div>
                )}

                {rule.type === "dateRange" && (
                  <>
                    <div
                      className="x_form-group"
                      style={{ marginBottom: "10px" }}
                    >
                      <label
                        className="x_form-label"
                        style={{ fontSize: "12px" }}
                      >
                        Valid From
                      </label>
                      <input
                        type="date"
                        className="x_form-control"
                        value={rule.from || ""}
                        onChange={(e) =>
                          updateRule(idx, "from", e.target.value)
                        }
                      />
                    </div>
                    <div
                      className="x_form-group"
                      style={{ marginBottom: "10px" }}
                    >
                      <label
                        className="x_form-label"
                        style={{ fontSize: "12px" }}
                      >
                        Valid To
                      </label>
                      <input
                        type="date"
                        className="x_form-control"
                        value={rule.to || ""}
                        onChange={(e) => updateRule(idx, "to", e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {rules.length > 0 && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            backgroundColor: "#f0f8ff",
            borderRadius: "4px",
            border: "1px solid #b3d9ff",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#0066cc",
              fontWeight: 500,
            }}
          >
            💡 Rules will be enforced server-side when users apply this coupon.
          </p>
        </div>
      )}
    </div>
  );
}

export default RuleGenerator;

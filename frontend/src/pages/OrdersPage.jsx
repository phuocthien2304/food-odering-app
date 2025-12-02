"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../styles/OrdersPage.css"

export default function OrdersPage({ API_URL }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/customer`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setOrders(response.data)
    } catch (error) {
      console.error("Failed to load orders", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  const getStatusBadgeClass = (status) => {
    return (
      {
        CREATED: "badge-pending",
        CONFIRMED: "badge-confirmed",
        PREPARING: "badge-preparing",
        READY: "badge-ready",
        COMPLETED: "badge-completed",
      }[status] || "badge-pending"
    )
  }

  if (loading) return <div className="loading">Loading orders...</div>

  return (
    <div className="orders-container">
      <h2>My Orders</h2>

      <div className="filter-tabs">
        {["all", "CREATED", "CONFIRMED", "PREPARING", "READY", "COMPLETED"].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All Orders" : status}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders yet</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header-row">
                <div>
                  <h3>Order #{order._id.slice(-8)}</h3>
                  <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="order-header-right">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>{order.status}</span>
                  <p className="order-total">${order.total?.toFixed(2) || "N/A"}</p>
                </div>
              </div>

              <button
                className="expand-btn"
                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              >
                {expandedOrder === order._id ? "Hide Details ▲" : "Show Details ▼"}
              </button>

              {expandedOrder === order._id && (
                <div className="order-details">
                  <div className="items-section">
                    <h4>Items</h4>
                    <ul className="items-list">
                      {order.items?.map((item, idx) => (
                        <li key={idx}>
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">x{item.quantity}</span>
                          <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="address-section">
                    <h4>Delivery Address</h4>
                    <p>{order.deliveryAddress?.street}</p>
                    <p>
                      {order.deliveryAddress?.ward}, {order.deliveryAddress?.district}
                    </p>
                    <p>{order.deliveryAddress?.city}</p>
                  </div>

                  {order.status === "READY" && (
                    <div className="status-info">
                      <p className="ready-alert">Your order is ready for pickup!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

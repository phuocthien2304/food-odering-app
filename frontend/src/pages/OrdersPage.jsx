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
    fetchOrders();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = setInterval(fetchOrders, 10000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/customer`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setOrders(response.data)
    } catch (error) {
      console.error("Tải đơn hàng thất bại", error)
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

  const statusTranslations = {
    all: "Tất cả đơn hàng",
    CREATED: "Đã tạo",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chuẩn bị",
    READY: "Sẵn sàng",
    COMPLETED: "Hoàn thành",
  }

  if (loading) return <div className="loading">Đang tải đơn hàng...</div>

  return (
    <div className="orders-container">
      <h2>Đơn hàng của tôi</h2>

      <div className="filter-tabs">
        {["all", "CREATED", "CONFIRMED", "PREPARING", "READY", "COMPLETED"].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {statusTranslations[status]}
          </button>
        ))}
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>Chưa có đơn hàng nào</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="order-card">
              <div className="order-header-row">
                <div>
                  <h3>Đơn hàng #{order._id.slice(-8)}</h3>
                  <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="order-header-right">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>{statusTranslations[order.status]}</span>
                  <p className="order-total">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total || 0)}</p>
                </div>
              </div>

              <button
                className="expand-btn"
                onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
              >
                {expandedOrder === order._id ? "Ẩn chi tiết ▲" : "Hiện chi tiết ▼"}
              </button>

              {expandedOrder === order._id && (
                <div className="order-details">
                  <div className="items-section">
                    <h4>Mặt hàng</h4>
                    <ul className="items-list">
                      {order.items?.map((item, idx) => (
                        <li key={idx}>
                          <span className="item-name">{item.name}</span>
                          <span className="item-qty">x{item.quantity}</span>
                          <span className="item-price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="address-section">
                    <h4>Địa chỉ giao hàng</h4>
                    <p>{order.deliveryAddress?.street}</p>
                    <p>
                      {order.deliveryAddress?.ward}, {order.deliveryAddress?.district}
                    </p>
                    <p>{order.deliveryAddress?.city}</p>
                  </div>

                  {order.status === "READY" && (
                    <div className="status-info">
                      <p className="ready-alert">Đơn hàng của bạn đã sẵn sàng để nhận!</p>
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

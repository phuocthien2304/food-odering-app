"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../styles/RestaurantDashboard.css"

export default function RestaurantDashboard({ API_URL }) {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0 })
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)

  useEffect(() => {
    fetchOrders()
    fetchStats()
    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchOrders()
      fetchStats()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/restaurant`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setOrders(response.data)
    } catch (error) {
      console.error("Tải đơn hàng thất bại", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/restaurant/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setStats(response.data)
    } catch (error) {
      console.error("Tải số liệu thống kê thất bại", error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/orders/${orderId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      fetchOrders()
      fetchStats()
    } catch (error) {
      alert("Cập nhật đơn hàng thất bại: " + error.response?.data?.message)
    }
  }

  if (loading) return <div className="loading">Đang tải bảng điều khiển...</div>

  return (
    <div className="dashboard-container">
      <h2>Bảng điều khiển nhà hàng</h2>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalOrders}</h3>
          <p>Tổng số đơn hàng</p>
        </div>
        <div className="stat-card">
          <h3>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue || 0)}</h3>
          <p>Tổng doanh thu</p>
        </div>
        <div className="stat-card pending">
          <h3>{stats.pendingOrders}</h3>
          <p>Đơn hàng chờ xử lý</p>
        </div>
      </div>

      {/* Orders Management */}
      <div className="orders-section">
        <h3>Quản lý đơn hàng</h3>
        {orders.length === 0 ? (
          <p className="no-orders">Chưa có đơn hàng nào</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order._id}
                className={`order-card ${selectedOrder?._id === order._id ? "expanded" : ""}`}
                onClick={() => setSelectedOrder(selectedOrder?._id === order._id ? null : order)}
              >
                <div className="order-header">
                  <div>
                    <h3>Đơn hàng #{order._id.slice(-8)}</h3>
                    <p className="order-time">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`status ${order.status?.toLowerCase()}`}>{order.status}</span>
                </div>

                <div className="order-info">
                  <p>
                    <strong>Tổng cộng:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total || 0)}
                  </p>
                  <p>
                    <strong>Mặt hàng:</strong> {order.items?.length || 0}
                  </p>
                </div>

                {selectedOrder?._id === order._id && (
                  <div className="order-details">
                    <h4>Mặt hàng:</h4>
                    <ul>
                      {order.items?.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x {item.quantity} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                          {item.notes && <p className="notes">Ghi chú: {item.notes}</p>}
                        </li>
                      ))}
                    </ul>

                    <div className="delivery-info">
                      <h4>Địa chỉ giao hàng:</h4>
                      <p>
                        {order.deliveryAddress?.street}, {order.deliveryAddress?.ward},{" "}
                        {order.deliveryAddress?.district}, {order.deliveryAddress?.city}
                      </p>
                    </div>

                    <div className="action-buttons">
                      {order.status === "CREATED" && (
                        <button
                          className="btn-action confirmed"
                          onClick={() => updateOrderStatus(order._id, "CONFIRMED")}
                        >
                          Xác nhận đơn hàng
                        </button>
                      )}
                      {order.status === "CONFIRMED" && (
                        <button
                          className="btn-action preparing"
                          onClick={() => updateOrderStatus(order._id, "PREPARING")}
                        >
                          Bắt đầu chuẩn bị
                        </button>
                      )}
                      {order.status === "PREPARING" && (
                        <button className="btn-action ready" onClick={() => updateOrderStatus(order._id, "READY")}>
                          Đánh dấu là sẵn sàng
                        </button>
                      )}
                      {order.status === "READY" && (
                        <button
                          className="btn-action completed"
                          onClick={() => updateOrderStatus(order._d, "COMPLETED")}
                        >
                          Hoàn thành đơn hàng
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

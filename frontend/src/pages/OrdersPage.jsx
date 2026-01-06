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
      if (error.response?.status !== 404) {
        console.error("Lỗi tải đơn hàng:", error.response?.data?.message || error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const [cancellingId, setCancellingId] = useState(null)
  const cancelOrder = async (orderId) => {
    const ok = window.confirm('Bạn có chắc muốn hủy đơn này?')
    if (!ok) return

    try {
      setCancellingId(orderId)
      await axios.patch(`${API_URL}/orders/${orderId}/cancel`, { reason: 'Customer cancelled' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      // Refresh list
      await fetchOrders()
      alert('Hủy đơn thành công')
    } catch (err) {
      console.error('Hủy đơn thất bại', err)
      const msg = err.response?.data?.message || err.message || 'Lỗi khi hủy đơn'
      alert(`Hủy đơn thất bại: ${msg}`)
    } finally {
      setCancellingId(null)
    }
  }

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  const getStatusBadgeClass = (status) => {
    return (
      {
        PENDING_PAYMENT: "badge-pending",
        PENDING_RESTAURANT_CONFIRMATION: "badge-pending",
        CREATED: "badge-pending",
        CONFIRMED: "badge-confirmed",
        PREPARING: "badge-preparing",
        READY: "badge-ready",
        CANCELLED: "badge-cancelled",
        REJECTED: "badge-cancelled",
        COMPLETED: "badge-completed",
      }[status] || "badge-pending"
    )
  }

  const statusTranslations = {
    all: "Tất cả đơn hàng",
    PENDING_PAYMENT: "Chờ thanh toán",
    PENDING_RESTAURANT_CONFIRMATION: "Chờ nhà hàng xác nhận",
    CREATED: "Đã tạo",
    CONFIRMED: "Đã xác nhận",
    PREPARING: "Đang chuẩn bị",
    READY: "Sẵn sàng",
    CANCELLED: "Đã hủy",
    REJECTED: "Đã từ chối",
    COMPLETED: "Hoàn thành",
  }

  const getPaymentLabel = (order) => {
    const method = order?.paymentMethod === 'ONLINE' ? 'SEPAY' : (order?.paymentMethod || 'COD');
    if (method === 'COD') return 'COD (Thanh toán khi nhận)';
    return 'SePay (Chuyển khoản)';
  }

  const getPaymentStatusLabel = (order) => {
    const method = order?.paymentMethod === 'ONLINE' ? 'SEPAY' : (order?.paymentMethod || 'COD');
    if (method === 'COD') {
      if (order?.status === 'CANCELLED') return 'Đã hủy';
      if (order?.status === 'REJECTED') return 'Đã từ chối';
      if (order?.status === 'COMPLETED') return 'Đã thanh toán';
      return 'Thanh toán khi nhận';
    }
    if (order?.status === 'PENDING_PAYMENT') return 'Chờ thanh toán';
    if (order?.status === 'CANCELLED') return 'Đã hủy';
    if (order?.status === 'REJECTED') return 'Đã hoàn tiền';
    return 'Đã thanh toán';
  }

  if (loading) return <div className="loading">Đang tải đơn hàng...</div>

  return (
    <div className="orders-container">
      <h2>Đơn hàng của tôi</h2>

      <div className="filter-tabs">
        {["all", "PENDING_PAYMENT", "PENDING_RESTAURANT_CONFIRMATION", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "REJECTED"].map((status) => (
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
                  <p className="order-date">Phương thức: {getPaymentLabel(order)}</p>
                  <p className="order-date">Thanh toán: {getPaymentStatusLabel(order)}</p>
                </div>
                <div className="order-header-right">
                  <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>{statusTranslations[order.status]}</span>
                  <p className={`order-total ${order.status === 'CANCELLED' ? 'cancelled' : ''}`}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total || 0)}</p>
                  {order.status === 'CANCELLED' && <p className="order-cancelled">Đã hủy</p>}
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

                  {order.status === "REJECTED" && (
                    <div className="status-info" style={{ backgroundColor: '#fff3cd', padding: '12px', borderRadius: '4px', marginTop: '12px' }}>
                      <p style={{ color: '#856404', fontWeight: 'bold', margin: 0 }}>❌ Đơn hàng đã bị nhà hàng từ chối</p>
                      <p style={{ color: '#856404', margin: '8px 0 0 0' }}>Lý do: {order.rejectionReason || 'Không có lý do'}</p>
                      {(order.paymentMethod === 'SEPAY' || order.paymentMethod === 'ONLINE') && (
                        <p style={{ color: '#28a745', fontWeight: 'bold', margin: '8px 0 0 0' }}>💰 Tiền đã được hoàn lại tự động</p>
                      )}
                    </div>
                  )}

                  {['CREATED', 'CONFIRMED', 'PENDING_PAYMENT', 'PENDING_RESTAURANT_CONFIRMATION'].includes(order.status) && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="btn-action cancel"
                        onClick={() => cancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                      >
                        {cancellingId === order._id ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
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

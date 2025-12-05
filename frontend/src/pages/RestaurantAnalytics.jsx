"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../styles/RestaurantAnalytics.css"

export default function RestaurantAnalytics({ API_URL }) {
  const [analytics, setAnalytics] = useState({
    dailyRevenue: [],
    topItems: [],
    orderCount: 0,
    revenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_URL}/restaurant/analytics`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setAnalytics(response.data)
    } catch (error) {
      console.error("Tải phân tích thất bại", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Đang tải phân tích...</div>

  return (
    <div className="analytics-container">
      <h2>Phân tích</h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>{analytics.orderCount}</h3>
          <p>Tổng số đơn hàng</p>
        </div>
        <div className="analytics-card">
          <h3>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(analytics.revenue || 0)}</h3>
          <p>Tổng doanh thu</p>
        </div>
        <div className="analytics-card">
          <h3>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((analytics.revenue || 0) / (analytics.orderCount || 1))}</h3>
          <p>Giá trị đơn hàng trung bình</p>
        </div>
      </div>

      <div className="top-items">
        <h3>Mặt hàng hàng đầu</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Tên mặt hàng</th>
              <th>Đơn hàng</th>
              <th>Doanh thu</th>
            </tr>
          </thead>
          <tbody>
            {analytics.topItems?.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.orderCount}</td>
                <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.revenue || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

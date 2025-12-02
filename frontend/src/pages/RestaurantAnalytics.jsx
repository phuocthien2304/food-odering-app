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
      console.error("Failed to load analytics", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading analytics...</div>

  return (
    <div className="analytics-container">
      <h2>Analytics</h2>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>{analytics.orderCount}</h3>
          <p>Total Orders</p>
        </div>
        <div className="analytics-card">
          <h3>${(analytics.revenue || 0).toFixed(2)}</h3>
          <p>Total Revenue</p>
        </div>
        <div className="analytics-card">
          <h3>${((analytics.revenue || 0) / (analytics.orderCount || 1)).toFixed(2)}</h3>
          <p>Avg Order Value</p>
        </div>
      </div>

      <div className="top-items">
        <h3>Top Items</h3>
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {analytics.topItems?.map((item) => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.orderCount}</td>
                <td>${(item.revenue || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

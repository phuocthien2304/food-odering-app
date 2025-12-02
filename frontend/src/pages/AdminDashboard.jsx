"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../styles/AdminDashboard.css"

export default function AdminDashboard({ API_URL }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [currentTab, setCurrentTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setStats(response.data)
    } catch (error) {
      console.error("Failed to load stats", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading admin dashboard...</div>

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage users and restaurants</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${currentTab === "dashboard" ? "active" : ""}`}
          onClick={() => setCurrentTab("dashboard")}
        >
          Overview
        </button>
        <button className={`tab-btn ${currentTab === "users" ? "active" : ""}`} onClick={() => setCurrentTab("users")}>
          Users
        </button>
        <button
          className={`tab-btn ${currentTab === "restaurants" ? "active" : ""}`}
          onClick={() => setCurrentTab("restaurants")}
        >
          Restaurants
        </button>
      </div>

      {currentTab === "dashboard" && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
            <div className="stat-icon">👥</div>
          </div>
          <div className="stat-card">
            <h3>{stats.totalRestaurants}</h3>
            <p>Total Restaurants</p>
            <div className="stat-icon">🏪</div>
          </div>
          <div className="stat-card">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
            <div className="stat-icon">📋</div>
          </div>
          <div className="stat-card">
            <h3>${(stats.totalRevenue || 0).toFixed(2)}</h3>
            <p>Total Revenue</p>
            <div className="stat-icon">💰</div>
          </div>
        </div>
      )}

      {currentTab === "users" && <UserManagement API_URL={API_URL} />}
      {currentTab === "restaurants" && <RestaurantManagement API_URL={API_URL} />}
    </div>
  )
}

function UserManagement({ API_URL }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setUsers(response.data)
    } catch (error) {
      console.error("Failed to load users", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      alert("User deleted successfully")
      fetchUsers()
    } catch (error) {
      alert("Failed to delete user")
    }
  }

  if (loading) return <p>Loading users...</p>

  return (
    <div className="management-section">
      <h3>User Management</h3>
      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className="badge">{user.userType}</span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="btn-delete" onClick={() => deleteUser(user._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RestaurantManagement({ API_URL }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/restaurants`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setRestaurants(response.data)
    } catch (error) {
      console.error("Failed to load restaurants", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleRestaurantStatus = async (restaurantId, currentStatus) => {
    try {
      await axios.patch(
        `${API_URL}/admin/restaurants/${restaurantId}`,
        { active: !currentStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      fetchRestaurants()
    } catch (error) {
      alert("Failed to update restaurant")
    }
  }

  if (loading) return <p>Loading restaurants...</p>

  return (
    <div className="management-section">
      <h3>Restaurant Management</h3>
      <div className="table-container">
        <table className="management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Address</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((rest) => (
              <tr key={rest._id}>
                <td>{rest.name}</td>
                <td>{rest.owner?.name}</td>
                <td>{rest.address}</td>
                <td>
                  <span className={`status-badge ${rest.active ? "active" : "inactive"}`}>
                    {rest.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button className="btn-toggle" onClick={() => toggleRestaurantStatus(rest._id, rest.active)}>
                    {rest.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

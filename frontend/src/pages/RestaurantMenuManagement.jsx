"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../styles/RestaurantMenuManagement.css"

export default function RestaurantMenuManagement({ API_URL }) {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
  })

  useEffect(() => {
    fetchMenuItems()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/menu`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      setMenuItems(response.data)
    } catch (error) {
      console.error("Failed to load menu", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      await axios.post(`${API_URL}/menu`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      alert("Item added successfully!")
      setFormData({ name: "", description: "", price: "", category: "" })
      setShowForm(false)
      fetchMenuItems()
    } catch (error) {
      alert("Failed to add item: " + error.response?.data?.message)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return
    try {
      await axios.delete(`${API_URL}/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      alert("Item deleted successfully!")
      fetchMenuItems()
    } catch (error) {
      alert("Failed to delete item")
    }
  }

  if (loading) return <div className="loading">Loading menu...</div>

  return (
    <div className="menu-management">
      <h2>Menu Management</h2>

      <button className="btn-add-item" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cancel" : "Add New Item"}
      </button>

      {showForm && (
        <form className="add-item-form" onSubmit={handleAddItem}>
          <input
            type="text"
            name="name"
            placeholder="Item Name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="form-input"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleInputChange}
            className="form-textarea"
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleInputChange}
            required
            step="0.01"
            className="form-input"
          />
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={formData.category}
            onChange={handleInputChange}
            className="form-input"
          />
          <button type="submit" className="btn-submit">
            Add Item
          </button>
        </form>
      )}

      <div className="menu-items-list">
        {menuItems.length === 0 ? (
          <p className="no-items">No menu items yet</p>
        ) : (
          menuItems.map((item) => (
            <div key={item._id} className="menu-item-card">
              <div className="item-content">
                <h3>{item.name}</h3>
                <p className="description">{item.description}</p>
                <p className="category">Category: {item.category}</p>
                <p className="price">${item.price.toFixed(2)}</p>
              </div>
              <button className="btn-delete" onClick={() => handleDeleteItem(item._id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

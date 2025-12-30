"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import "../styles/RestaurantMenuManagement.css"

export default function RestaurantMenuManagement({ API_URL, user }) {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  // add form
  const [showForm, setShowForm] = useState(false)

  // edit form
  const [editingItem, setEditingItem] = useState(null)
  const isEditing = !!editingItem

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "MAIN",
    image: "",
  })

  // ✅ Cho phép nhập phân loại mới
  const [isNewCategory, setIsNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState("")

  const CATEGORY_OPTIONS = useMemo(
    () => [
      { value: "APPETIZER", label: "Khai vị" },
      { value: "MAIN", label: "Món chính" },
      { value: "DESSERT", label: "Tráng miệng" },
      { value: "BEVERAGE", label: "Đồ uống" },
      { value: "COMBO", label: "Combo" },
    ],
    []
  )

  const CATEGORY_LABELS_VI = useMemo(() => {
    const m = {}
    for (const opt of CATEGORY_OPTIONS) m[opt.value] = opt.label
    return m
  }, [CATEGORY_OPTIONS])

  const normalizeCategory = (s) =>
    String(s || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")

  useEffect(() => {
    if (user && user.restaurantId) {
      fetchMenuItems()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchMenuItems = async () => {
    if (!user || !user.restaurantId) return
    try {
      const response = await axios.get(
        `${API_URL}/restaurants/${user.restaurantId}/menu/manage`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      )
      setMenuItems(response.data)
    } catch (error) {
      console.error("Tải thực đơn thất bại", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const openAddForm = () => {
    setEditingItem(null)
    setIsNewCategory(false)
    setNewCategory("")
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "MAIN",
      image: "",
    })
    setShowForm(true)
  }

  const openEditForm = (item) => {
    setEditingItem(item)
    setIsNewCategory(false)
    setNewCategory("")
    setFormData({
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      category: item.category || "MAIN",
      image: item.image || "",
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingItem(null)
    setIsNewCategory(false)
    setNewCategory("")
  }

  const buildFinalCategory = () => {
    const finalCategory = isNewCategory
      ? normalizeCategory(newCategory)
      : formData.category || "MAIN"

    if (isNewCategory && !finalCategory) {
      alert("Vui lòng nhập phân loại mới.")
      return null
    }
    return finalCategory
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user || !user.restaurantId) {
      alert("Không thể xác định nhà hàng của bạn.")
      return
    }

    const finalCategory = buildFinalCategory()
    if (!finalCategory) return

    const payload = {
      ...formData,
      category: finalCategory,
      price: formData.price === "" ? "" : parseFloat(formData.price),
    }

    try {
      if (!isEditing) {
        // ✅ ADD
        await axios.post(`${API_URL}/restaurants/${user.restaurantId}/menu/manage`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        alert("Thêm món thành công!")
      } else {
        // ✅ EDIT
        await axios.patch(`${API_URL}/restaurants/menu/${editingItem._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
        alert("Cập nhật món thành công!")
      }

      closeForm()
      fetchMenuItems()
    } catch (error) {
      alert(
        (isEditing ? "Cập nhật thất bại: " : "Thêm món thất bại: ") +
          (error.response?.data?.message || "Unknown error")
      )
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa món này không?")) return
    try {
      await axios.delete(`${API_URL}/restaurants/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      alert("Xóa món thành công!")
      fetchMenuItems()
    } catch (error) {
      alert("Xóa món thất bại")
    }
  }

  // ✅ Toggle: Tạm ẩn (isActive) & Hết món (isAvailable)
  const patchMenuItem = async (menuItemId, data) => {
    await axios.patch(`${API_URL}/restaurants/menu/${menuItemId}`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
  }

  if (loading) return <div className="loading">Đang tải thực đơn...</div>

  if (!user || !user.restaurantId) {
    return (
      <div className="menu-management">
        <h2>Quản lý thực đơn</h2>
        <p>Bạn chưa tạo nhà hàng. Vui lòng tạo nhà hàng trước khi quản lý thực đơn.</p>
        <button
          className="btn-add-item"
          onClick={() => (window.location.href = "/restaurant/dashboard")}
        >
          Tạo nhà hàng
        </button>
      </div>
    )
  }

  return (
    <div className="menu-management">
      <h2>Quản lý thực đơn</h2>

      <button
        className="btn-add-item"
        onClick={() => (showForm ? closeForm() : openAddForm())}
      >
        {showForm ? "Hủy" : "Thêm món mới"}
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>{isEditing ? "Sửa món ăn" : "Thêm món ăn"}</h3>
              <button type="button" className="modal-close" onClick={closeForm}>
                ✕
              </button>
            </div>

            <form className="add-item-form modal-form" onSubmit={handleSubmit}>
              {/* Tên món */}
              <input
                type="text"
                name="name"
                placeholder="Tên món"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="form-input"
              />

              {/* Mô tả */}
              <textarea
                name="description"
                placeholder="Mô tả"
                value={formData.description}
                onChange={handleInputChange}
                className="form-textarea"
              />

              {/* Giá */}
              <input
                type="number"
                name="price"
                placeholder="Giá"
                value={formData.price}
                onChange={handleInputChange}
                required
                step="1000"
                className="form-input"
              />

              {/* Loại món */}
              <div className="form-group">
                <label>Loại món</label>
                <select
                  name="category"
                  className="form-input"
                  value={isNewCategory ? "__NEW__" : formData.category}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "__NEW__") {
                      setIsNewCategory(true)
                      setNewCategory("")
                      return
                    }
                    setIsNewCategory(false)
                    setNewCategory("")
                    setFormData((prev) => ({ ...prev, category: v }))
                  }}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value="__NEW__">➕ Thêm phân loại mới...</option>
                </select>

                {isNewCategory && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nhập phân loại mới (vd: NOODLES, FAST_FOOD...)"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
                      Sẽ lưu thành: <b>{normalizeCategory(newCategory) || "(chưa nhập)"}</b>
                    </div>
                  </div>
                )}
              </div>

              {/* URL hình ảnh */}
              <input
                type="url"
                name="image"
                placeholder="URL hình ảnh"
                value={formData.image}
                onChange={handleInputChange}
                className="form-input"
              />

              {/* Nút submit */}
              <button type="submit" className="btn-submit">
                {isEditing ? "Lưu thay đổi" : "Thêm món"}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="menu-items-list">
        {menuItems.length === 0 ? (
          <p className="no-items">Chưa có món ăn nào trong thực đơn</p>
        ) : (
          menuItems.map((item) => {
            const categoryVi = CATEGORY_LABELS_VI[item.category] || item.category

            // ✅ 2 trạng thái như bạn yêu cầu
            const hidden = item?.isActive === false
            const soldOut = item?.isAvailable === false || item?.quantity === 0

            return (
              <div key={item._id} className="menu-item-card">
                {item.image && (
                  <div className="item-image">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                )}

                <div className="item-content">
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                  <p className="category">Loại: {categoryVi}</p>
                  <p className="price">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(item.price)}
                  </p>

                  {/* ✅ TẠM ẨN + HẾT MÓN */}
                  <div className="item-flags">
                    {/* Tạm ẩn: người mua KHÔNG thấy */}
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={hidden}
                        onChange={async (e) => {
                          try {
                            await patchMenuItem(item._id, { isActive: !e.target.checked })
                            fetchMenuItems()
                          } catch (err) {
                            alert(err.response?.data?.message || "Không thể cập nhật Tạm ẩn")
                          }
                        }}
                      />
                      <span className="slider" />
                      <span className="switch-text">Tạm ẩn</span>
                    </label>

                    {/* Hết món: người mua vẫn thấy nhưng hiện “Bán hết” */}
                    <label className="checkbox-soldout">
                      <input
                        type="checkbox"
                        checked={soldOut}
                        onChange={async (e) => {
                          try {
                            await patchMenuItem(item._id, { isAvailable: !e.target.checked })
                            fetchMenuItems()
                          } catch (err) {
                            alert(err.response?.data?.message || "Không thể cập nhật Hết món")
                          }
                        }}
                      />
                      <span>Hết món</span>
                    </label>
                  </div>
                </div>

                <div className="item-actions">
                  <button className="btn-edit" onClick={() => openEditForm(item)}>
                    Sửa
                  </button>
                  <button className="btn-delete" onClick={() => handleDeleteItem(item._id)}>
                    Xóa
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

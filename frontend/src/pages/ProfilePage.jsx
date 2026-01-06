"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../styles/ProfilePage.css"

export default function ProfilePage({ API_URL, user, updateUser }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
      setProfile(response.data)
      setFormData({
        name: response.data.name || "",
        phoneNumber: response.data.phoneNumber || "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
    } catch (error) {
      console.error("Lỗi tải thông tin cá nhân", error)
      alert("Không thể tải thông tin cá nhân")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate password change
    if (formData.newPassword) {
      if (!formData.oldPassword) {
        alert("Vui lòng nhập mật khẩu cũ để đổi mật khẩu mới")
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        alert("Mật khẩu mới và xác nhận mật khẩu không khớp")
        return
      }
      if (formData.newPassword.length < 6) {
        alert("Mật khẩu mới phải có ít nhất 6 ký tự")
        return
      }
    }

    try {
      const updateData = {
        name: formData.name,
        phoneNumber: formData.phoneNumber
      }

      // Only include password fields if user wants to change password
      if (formData.newPassword) {
        updateData.oldPassword = formData.oldPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await axios.patch(
        `${API_URL}/auth/profile/${profile._id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      )
      setProfile(response.data)
      updateUser(response.data)
      setEditing(false)
      setFormData({
        name: response.data.name || "",
        phoneNumber: response.data.phoneNumber || "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      alert("Cập nhật thông tin thành công!")
    } catch (error) {
      console.error("Lỗi cập nhật thông tin", error)
      alert("Không thể cập nhật thông tin: " + (error.response?.data?.message || error.message))
    }
  }

  const getUserTypeLabel = (type) => {
    const labels = {
      CUSTOMER: "Khách hàng",
      RESTAURANT_STAFF: "Nhân viên nhà hàng",
      DRIVER: "Tài xế",
      ADMIN: "Quản trị viên"
    }
    return labels[type] || type
  }

  if (loading) return <div className="loading">Đang tải thông tin...</div>

  if (!profile) return <div className="error">Không tìm thấy thông tin người dùng</div>

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Thông tin cá nhân</h2>
        {!editing && (
          <button className="btn-edit" onClick={() => setEditing(true)}>
            ✏️ Chỉnh sửa
          </button>
        )}
      </div>

      {!editing ? (
        <div className="profile-view">
          <div className="profile-section">
            <h3>Thông tin cơ bản</h3>
            <div className="info-row">
              <span className="label">Họ và tên:</span>
              <span className="value">{profile.name || "Chưa cập nhật"}</span>
            </div>
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{profile.email}</span>
            </div>
            <div className="info-row">
              <span className="label">Số điện thoại:</span>
              <span className="value">{profile.phoneNumber || "Chưa cập nhật"}</span>
            </div>
            <div className="info-row">
              <span className="label">Loại tài khoản:</span>
              <span className="value badge">{getUserTypeLabel(profile.userType)}</span>
            </div>
          </div>

          {profile.userType === "RESTAURANT_STAFF" && profile.restaurantId && (
            <div className="profile-section">
              <h3>Thông tin nhà hàng</h3>
              <div className="info-row">
                <span className="label">ID Nhà hàng:</span>
                <span className="value">{profile.restaurantId}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <h3>Thông tin cơ bản</h3>
          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="disabled"
            />
            <small>Email không thể thay đổi</small>
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
            />
          </div>

          <h3>Đổi mật khẩu (tùy chọn)</h3>
          <div className="form-group">
            <label>Mật khẩu cũ</label>
            <input
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              placeholder="Nhập mật khẩu cũ nếu muốn đổi mật khẩu"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
            />
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
              💾 Lưu thay đổi
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => {
                setEditing(false)
                setFormData({
                  name: profile.name || "",
                  phoneNumber: profile.phoneNumber || "",
                  oldPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                })
              }}
            >
              ❌ Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

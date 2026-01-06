"use client"

import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import "../styles/HomePage.css"

export default function HomePage({ onLoginSuccess, user, API_URL }) {
  const [isLogin, setIsLogin] = useState(true)
  const [userType, setUserType] = useState("CUSTOMER")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check confirm password (register only)
    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại!")
      return
    }

    try {
      // ================= LOGIN =================
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
        })

        if (res.data?.token) {
          onLoginSuccess(res.data.token)
        }
        return
      }

      // ================= REGISTER =================
      await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        userType,
      })

      alert("Đăng ký tài khoản thành công!")

      // AUTO LOGIN after register
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: formData.email,
        password: formData.password,
      })

      if (loginRes.data?.token) {
        onLoginSuccess(loginRes.data.token)
      } else {
        alert("Đăng ký thành công nhưng đăng nhập tự động thất bại. Vui lòng đăng nhập lại.")
        setIsLogin(true)
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi"

      if (
        error.response?.status === 409 ||
        errorMessage.toLowerCase().includes("email")
      ) {
        alert("Đăng ký thất bại: Email này đã được sử dụng. Vui lòng chọn email khác!")
      } else {
        alert("Lỗi: " + errorMessage)
      }

      console.error("Auth Error:", error)
    }
  }

  // ================= ALREADY LOGIN =================
  if (user) {
    return (
      <div className="home-container welcome">
        <h2>Chào mừng trở lại, {user.name}!</h2>
        <p>Bạn đã đăng nhập với tư cách {user.userType}</p>

        <button
          className="btn-primary"
          onClick={() => {
            if (user.userType === "ADMIN") navigate("/admin/dashboard")
            else if (user.userType === "RESTAURANT_STAFF") navigate("/restaurant/dashboard")
            else if (user.userType === "DRIVER") navigate("/driver/dashboard")
            else navigate("/foods")
          }}
        >
          Đi đến Bảng điều khiển
        </button>
      </div>
    )
  }

  // ================= AUTH FORM =================
  return (
    <div className="home-container">
      <div className="hero">
        <h2>Chào mừng đến với ứng dụng đặt món ăn</h2>
        <p>Đặt món ăn ngon từ nhà hàng yêu thích của bạn</p>
      </div>

      <div className="auth-container">
        <div className="auth-form">
          <h3>{isLogin ? "Đăng nhập" : "Đăng ký"}</h3>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="Họ và tên"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

                <div className="user-type-selector">
                  <label>Chọn loại tài khoản:</label>
                  <div className="type-options">
                    {["CUSTOMER", "RESTAURANT_STAFF", "DRIVER"].map((type) => (
                      <label className="type-option" key={type}>
                        <input
                          type="radio"
                          value={type}
                          checked={userType === type}
                          onChange={(e) => setUserType(e.target.value)}
                        />
                        <span>
                          {type === "CUSTOMER"
                            ? "Khách hàng"
                            : type === "RESTAURANT_STAFF"
                            ? "Nhà hàng"
                            : "Tài xế"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {!isLogin && (
              <input
                type="password"
                name="confirmPassword"
                placeholder="Xác nhận mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            )}

            <button type="submit" className="btn-primary">
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>

          <p className="toggle-auth">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              className="toggle-link"
              onClick={() => {
                setIsLogin(!isLogin)
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                })
              }}
            >
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

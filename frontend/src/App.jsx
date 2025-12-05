"use client"

import { useState, useEffect } from "react"
import { Routes, Route, useNavigate, useLocation, Navigate, Outlet } from "react-router-dom"
import axios from "axios"
import "./App.css"

// Import Pages
import HomePage from "./pages/HomePage"
import RestaurantsPage from "./pages/RestaurantsPage"
import CartPage from "./pages/CartPage"
import OrdersPage from "./pages/OrdersPage"
import RestaurantDashboard from "./pages/RestaurantDashboard"
import AdminDashboard from "./pages/AdminDashboard"
import RestaurantMenuManagement from "./pages/RestaurantMenuManagement"
import RestaurantAnalytics from "./pages/RestaurantAnalytics"

// --- Component Bảo vệ Route ---
// Giúp chặn người không có quyền truy cập vào link cụ thể
const ProtectedRoute = ({ user, allowedRoles, redirectPath = "/" }) => {
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.userType)) return <Navigate to={redirectPath} replace />;
  return <Outlet />;
};

export default function App() {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  const navigate = useNavigate();
  const location = useLocation();

  // Dùng biến môi trường nếu có, không thì localhost
  const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:3000/api"

  // 1. Khôi phục phiên đăng nhập khi F5
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      verifyUser(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyUser = async (token) => {
    try {
      // ✅ Đã sửa thành /auth/profile cho đúng với Gateway mới
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUser(response.data)
      // Nếu đang ở trang chủ '/' mà đã login, tự động chuyển vào dashboard
      if (location.pathname === '/') {
        redirectBasedOnRole(response.data.userType);
      }
    } catch (error) {
      console.error("Phiên đã hết hạn")
      localStorage.removeItem("token")
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Hàm điều hướng dựa trên quyền
  const redirectBasedOnRole = (role) => {
    if (role === "ADMIN") navigate("/admin/dashboard");
    else if (role === "RESTAURANT_STAFF") navigate("/restaurant/dashboard");
    else navigate("/restaurants"); // Khách hàng
  }

  // Xử lý Login từ HomePage
  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
    redirectBasedOnRole(userData.userType)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setCart([])
    navigate("/")
  }

  // --- Logic Giỏ hàng ---
  const addToCart = (item) => {
    const existingItem = cart.find((c) => c.menuItemId === item._id)
    if (existingItem) {
      setCart(cart.map((c) => (c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c)))
    } else {
      setCart([...cart, { menuItemId: item._id, restaurantId: item.restaurantId, name: item.name, price: item.price, quantity: 1 }])
    }
  }

  const removeFromCart = (item, isAdd = false) => {
    const updated = [...cart]
    const index = updated.findIndex(i => i.menuItemId === item.menuItemId);
    if(index === -1) return;

    if (isAdd) updated[index].quantity += 1
    else if (updated[index].quantity > 1) updated[index].quantity -= 1
    else updated.splice(index, 1)
    setCart(updated)
  }

  const clearCart = () => setCart([])

  if (isLoading) return <div className="loading-container"><div className="spinner"></div><p>Đang tải...</p></div>

  return (
    <div className="app">
      {/* --- NAVBAR --- */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
            <h1>🍕 Đặt món ăn</h1>
          </div>
          <div className="nav-links">
            {user ? (
              <>
                {user.userType === "ADMIN" && (
                  <button className="nav-btn" onClick={() => navigate("/admin/dashboard")}>Bảng điều khiển</button>
                )}
                {user.userType === "RESTAURANT_STAFF" && (
                  <>
                    <button className="nav-btn" onClick={() => navigate("/restaurant/dashboard")}>Đơn hàng</button>
                    <button className="nav-btn" onClick={() => navigate("/restaurant/menu")}>Thực đơn</button>
                    <button className="nav-btn" onClick={() => navigate("/restaurant/analytics")}>Phân tích</button>
                  </>
                )}
                {user.userType === "CUSTOMER" && (
                  <>
                    <button className="nav-btn" onClick={() => navigate("/restaurants")}>Nhà hàng</button>
                    <button className="nav-btn" onClick={() => navigate("/orders")}>Đơn hàng của tôi</button>
                    <button className="nav-btn cart-btn" onClick={() => navigate("/cart")}>Giỏ hàng ({cart.length})</button>
                  </>
                )}
                <span className="user-info">Chào, {user.name}</span>
                <button className="logout-btn" onClick={handleLogout}>Đăng xuất</button>
              </>
            ) : (
              <button className="nav-btn" onClick={() => navigate("/")}>Đăng nhập</button>
            )}
          </div>
        </div>
      </nav>

      {/* --- ĐỊNH TUYẾN (ROUTING) --- */}
      <main className="main-content">
        <Routes>
          {/* Trang chủ (Public) */}
          <Route path="/" element={
            <HomePage 
              onLoginSuccess={handleLoginSuccess} 
              user={user} 
              API_URL={API_URL}
            />
          } />

          {/* Routes cho KHÁCH HÀNG */}
          <Route element={<ProtectedRoute user={user} allowedRoles={['CUSTOMER']} />}>
            <Route path="/restaurants" element={<RestaurantsPage cart={cart} addToCart={addToCart} API_URL={API_URL} />} />
            {/* Truyền navigate xuống CartPage để chuyển trang sau khi đặt hàng */}
            <Route path="/cart" element={<CartPage cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} API_URL={API_URL} navigate={navigate} user={user} />} />
            <Route path="/orders" element={<OrdersPage API_URL={API_URL} />} />
          </Route>

          {/* Routes cho CHỦ NHÀ HÀNG */}
          <Route element={<ProtectedRoute user={user} allowedRoles={['RESTAURANT_STAFF']} />}>
            <Route path="/restaurant/dashboard" element={<RestaurantDashboard API_URL={API_URL} />} />
            <Route path="/restaurant/menu" element={<RestaurantMenuManagement API_URL={API_URL} user={user} />} />
            <Route path="/restaurant/analytics" element={<RestaurantAnalytics API_URL={API_URL} />} />
          </Route>

          {/* Routes cho ADMIN */}
          <Route element={<ProtectedRoute user={user} allowedRoles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard API_URL={API_URL} />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<div style={{textAlign:'center', marginTop:'50px'}}><h2>404 không tìm thấy</h2></div>} />
        </Routes>
      </main>

      <footer className="footer">
        <p>&copy; 2025 Ứng dụng đặt món ăn. Đã đăng ký bản quyền.</p>
      </footer>
    </div>
  )
}

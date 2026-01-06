"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import "../styles/RestaurantsPage.css"

export default function RestaurantsPage({ cart, addToCart, API_URL }) {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)

  useEffect(() => {
    fetchRestaurants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRestaurants = async () => {
    try {
      const response = await axios.get(`${API_URL}/restaurants`)
      setRestaurants(response.data)
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Lỗi tải nhà hàng:", error.response?.data?.message || error.message)
      }
      alert("Không thể tải danh sách nhà hàng")
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address) => {
    if (!address) return "Không có địa chỉ"
    if (typeof address === "string") return address
    return `${address.street || ""}, ${address.ward || ""}, ${address.district || ""}, ${address.city || ""}`.replace(
      /^, | , | ,/g,
      ""
    )
  }

  const filteredRestaurants = restaurants.filter((r) =>
    r?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="loading">Đang tải nhà hàng...</div>

  return (
    <div className="restaurants-container">
      <div className="restaurants-header">
        <h2>Duyệt nhà hàng</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm nhà hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="restaurants-grid">
        {filteredRestaurants.length === 0 ? (
          <p className="no-results">Không tìm thấy nhà hàng nào</p>
        ) : (
          filteredRestaurants.map((restaurant) => (
            <div key={restaurant._id} className="restaurant-card">
              <div className="restaurant-image">
                <img
                  src={`/placeholder.svg?height=200&width=300&query=restaurant+${restaurant.name}`}
                  alt={restaurant.name}
                />
                {restaurant.rating && <span className="rating">⭐ {restaurant.rating}</span>}
              </div>
              <div className="restaurant-info">
                <h3>{restaurant.name}</h3>
                <p className="cuisine">{restaurant.cuisineType || "Nhiều loại"}</p>
                <p className="address">{formatAddress(restaurant.address)}</p>

                <div className="delivery-info">
                  <span>📍 {restaurant.deliveryTime || "30-45"} phút</span>
                  <span>
                    💲{" "}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(restaurant.minOrder || 0)}{" "}
                    tối thiểu
                  </span>
                </div>

                <button
                  className="btn-view-menu"
                  onClick={() => setSelectedRestaurant(restaurant)}
                >
                  Xem thực đơn
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRestaurant && (
        <RestaurantMenu
          restaurant={selectedRestaurant}
          onClose={() => setSelectedRestaurant(null)}
          addToCart={addToCart}
          API_URL={API_URL}
          formatAddress={formatAddress}
        />
      )}
    </div>
  )
}

function RestaurantMenu({ restaurant, onClose, addToCart, API_URL, formatAddress }) {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant._id])

  const fetchMenu = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/restaurants/${restaurant._id}/menu`
      )
      setMenuItems(response.data)
    } catch (error) {
      console.error("Lỗi tải thực đơn", error)
    } finally {
      setLoading(false)
    }
  }

  const safeAddress = formatAddress
    ? formatAddress(restaurant.address)
    : "Không có địa chỉ"

  if (loading)
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <p>Đang tải thực đơn...</p>
        </div>
      </div>
    )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="menu-header">
          <h2>{restaurant.name}</h2>
          <p>{safeAddress}</p>
        </div>

        <div className="menu-items">
          {menuItems.length === 0 ? (
            <p className="no-items">Không có món ăn nào</p>
          ) : (
            menuItems
              // ✅ Tạm ẩn → không hiện
              .filter((item) => item.isActive !== false)
              .map((item) => {
                const soldOut =
                  item?.isAvailable === false || item.quantity === 0

                return (
                  <div key={item._id} className="menu-item">
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="description">{item.description}</p>
                      <p className="price">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(item.price)}
                      </p>

                      {soldOut && (
                        <span className="sold-out-text">Hết món</span>
                      )}
                    </div>

                    <button
  className="btn-add"
  disabled={soldOut}
  onClick={() => {
    if (soldOut) return
    addToCart({
      _id: item._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      name: item.name,
      price: item.price,
    })
  }}
>
  {soldOut ? "Hết món" : "Thêm vào giỏ hàng"}
</button>

                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import "../styles/FoodsPage.css"

export default function FoodsPage({ addToCart, API_URL }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchFoods("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchFoods = async (q) => {
    try {
      setLoading(true)
      const suffix = q ? `?q=${encodeURIComponent(q)}` : ""
      const response = await axios.get(`${API_URL}/restaurants/menu${suffix}`)
      setItems(response.data || [])
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Lỗi tải món ăn:", error.response?.data?.message || error.message)
      }
      alert("Không thể tải danh sách món ăn")
    } finally {
      setLoading(false)
    }
  }

  const visibleItems = useMemo(() => {
    // ✅ Ẩn món bị tắt (isActive=false)
    const base = (items || []).filter((it) => it?.isActive !== false)

    const q = searchTerm.trim().toLowerCase()
    if (!q) return base

    return base.filter((it) => {
      const name = String(it?.name || "").toLowerCase()
      const desc = String(it?.description || "").toLowerCase()
      const restaurantName = String(it?.restaurantId?.name || "").toLowerCase()
      return name.includes(q) || desc.includes(q) || restaurantName.includes(q)
    })
  }, [items, searchTerm])

  const handleAdd = (item) => {
    const restaurantId = item?.restaurantId?._id || item?.restaurantId
    const restaurantName = item?.restaurantId?.name
    addToCart({
      _id: item._id,
      restaurantId,
      restaurantName,
      name: item.name,
      price: item.price,
    })
  }

  if (loading) return <div className="loading">Đang tải món ăn.</div>

  return (
    <div className="foods-container">
      <div className="foods-header">
        <h2>Chọn món ăn hehe</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm món, mô tả, nhà hàng."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button
            className="btn-search"
            type="button"
            onClick={() => fetchFoods(searchTerm)}
            disabled={loading}
          >
            Tìm
          </button>
        </div>
      </div>

      <div className="foods-grid">
        {visibleItems.length === 0 ? (
          <p className="no-results">Không tìm thấy món ăn nào</p>
        ) : (
          visibleItems.map((item) => {
            // ✅ Bán hết nếu isAvailable=false hoặc quantity === 0
            const soldOut = item?.isAvailable === false || item?.quantity === 0

            return (
              <div key={item._id} className="food-card">
                <div className="food-image">
                  <img
                    src={
                      item.image ||
                      `/placeholder.svg?height=200&width=300&query=food+${encodeURIComponent(
                        item.name || "food"
                      )}`
                    }
                    alt={item.name}
                  />

                  {/* ✅ Overlay “Bán hết” */}
                  {soldOut && (
                    <div className="soldout-overlay">
                      <div className="soldout-circle">Bán hết</div>
                    </div>
                  )}
                </div>

                <div className="food-info">
                  <h3 className="food-name">{item.name}</h3>
                  <p className="food-restaurant">
                    {item?.restaurantId?.name || "Nhà hàng"}
                  </p>

                  {item.description && (
                    <p className="food-desc">{item.description}</p>
                  )}

                  <div className="food-bottom">
                    <div className="food-price">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.price || 0)}
                    </div>

                    <button
                      className="btn-add"
                      disabled={soldOut}
                      onClick={() => handleAdd(item)}
                    >
                      {soldOut ? "Hết món" : "Thêm"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

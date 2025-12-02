"use client"

import { useState } from "react"
import axios from "axios"
import "../styles/CartPage.css"

export default function CartPage({ cart, removeFromCart, clearCart, API_URL, navigate }) {
  const [loading, setLoading] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: "",
    ward: "",
    district: "",
    city: "",
  })

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setDeliveryAddress({ ...deliveryAddress, [name]: value })
  }

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.street || !deliveryAddress.ward || !deliveryAddress.district || !deliveryAddress.city) {
      alert("Please fill in all delivery address fields")
      return
    }

    if (cart.length === 0) {
      alert("Your cart is empty")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(
        `${API_URL}/orders`,
        {
          items: cart,
          total,
          deliveryAddress,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      alert("Order placed successfully!")
      clearCart()
      navigate("/orders")
    } catch (error) {
      alert("Failed to place order: " + error.response?.data?.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="cart-container">
      <h2>Shopping Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
          <button className="btn-continue" onClick={() => setCurrentPage("restaurants")}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <h3>Items</h3>
            <div className="items-list">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="item-info">
                    <h4>{item.name}</h4>
                    <p>
                      ${item.price.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <div className="item-total">
                    <p className="total">${(item.price * item.quantity).toFixed(2)}</p>
                    <div className="quantity-controls">
                      <button className="btn-minus" onClick={() => removeFromCart(index)}>
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button className="btn-plus" onClick={() => removeFromCart(index, true)}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-sidebar">
            <div className="delivery-form">
              <h3>Delivery Address</h3>
              <input
                type="text"
                name="street"
                placeholder="Street Address"
                value={deliveryAddress.street}
                onChange={handleAddressChange}
                className="form-input"
              />
              <input
                type="text"
                name="ward"
                placeholder="Ward"
                value={deliveryAddress.ward}
                onChange={handleAddressChange}
                className="form-input"
              />
              <input
                type="text"
                name="district"
                placeholder="District"
                value={deliveryAddress.district}
                onChange={handleAddressChange}
                className="form-input"
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                value={deliveryAddress.city}
                onChange={handleAddressChange}
                className="form-input"
              />
            </div>

            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>$2.00</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>${(total + 2).toFixed(2)}</span>
              </div>

              <button className="btn-place-order" onClick={handlePlaceOrder} disabled={loading}>
                {loading ? "Placing Order..." : "Place Order"}
              </button>
              <button className="btn-cancel" onClick={() => setCurrentPage("restaurants")}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

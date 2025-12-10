// client/pages/CartPage.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import MapPicker from '../components/MapPicker'
import AddressForm from '../components/AddressForm'
import { calculateDistance, calculateDeliveryFee, calculateDeliveryTime } from '../lib/distance'
import '../styles/CartPage.css'

export default function CartPage({ cart, removeFromCart, clearCart, API_URL, navigate, user }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  
  // STEP STATE
  const [step, setStep] = useState(1) // 1: Giỏ hàng (Toàn màn hình), 2: Thanh toán (Chia đôi)
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null)
  
  // Thông tin giao hàng
  const [recipientName, setRecipientName] = useState(user?.name || user?.firstName || '')
  const [recipientPhone, setRecipientPhone] = useState(user?.phoneNumber || '')
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    ward: '',
    district: '',
    city: '',
    province: ''
  })
  const [deliveryLocation, setDeliveryLocation] = useState(null)
  
  // Thanh toán
  const [paymentMethod, setPaymentMethod] = useState('COD')
  const [notes, setNotes] = useState('')

  // 1. Logic chọn nhà hàng tự động
  useEffect(() => {
    const ids = [...new Set(cart.map(i => i.restaurantId).filter(Boolean))]
    if (ids.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(ids[0])
    }
  }, [cart, selectedRestaurantId])

  // 2. Fetch thông tin nhà hàng khi select
  useEffect(() => {
    if (selectedRestaurantId) {
      fetchRestaurant(selectedRestaurantId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurantId])

  const fetchRestaurant = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/restaurants/${id}`)
      setRestaurant(res.data)
    } catch (err) {
      console.error('Failed to fetch restaurant', err)
    }
  }

  const handleMapSelect = (data) => {
    setDeliveryLocation({ lat: data.lat, lng: data.lng })
    setDeliveryAddress({
      street: data.street,
      ward: data.ward,
      district: data.district,
      province: data.province,
      fullAddress: data.fullAddress
    })
    setShowAddressForm(false)
  }

  // Logic tính tiền
  const calculateTotals = (items = []) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    let deliveryFee = 0
    let estimatedTime = 0

    if (deliveryLocation && restaurant?.location) {
      const distance = calculateDistance(
        restaurant.location.lat,
        restaurant.location.lng,
        deliveryLocation.lat,
        deliveryLocation.lng
      )
      deliveryFee = calculateDeliveryFee(distance)
      estimatedTime = calculateDeliveryTime(distance)
    }

    return {
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      estimatedTime
    }
  }

  const validateForm = () => {
    if (!recipientName) {
      setError('Vui lòng nhập tên người nhận')
      return false
    }
    if (!recipientPhone) {
      setError('Vui lòng nhập số điện thoại')
      return false
    }
    if (!deliveryLocation) {
      setError('Vui lòng chọn vị trí giao hàng trên bản đồ')
      return false
    }
    if (!deliveryAddress.street) {
      setError('Vui lòng chọn địa chỉ giao hàng')
      return false
    }
    return true
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Giỏ hàng trống')
      return
    }
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const itemsForOrder = cart.filter(i => i.restaurantId === selectedRestaurantId)
      const { total } = calculateTotals(itemsForOrder)
      const customerId = user?.id || user?._id || JSON.parse(localStorage.getItem('user') || '{}')?.id
      const restaurantId = selectedRestaurantId || cart[0]?.restaurantId

      if (!customerId || !restaurantId) {
        setError('Thông tin không hợp lệ. Vui lòng đăng nhập lại.')
        setLoading(false)
        return
      }

      const orderData = {
        customerId,
        restaurantId,
        items: itemsForOrder.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        paymentMethod,
        deliveryAddress,
        deliveryLocation,
        recipientName,
        recipientPhone,
        notes,
        totalAmount: total
      }

      const res = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })

      if (res.data) {
        const remaining = cart.filter(i => i.restaurantId !== restaurantId)
        clearCart()
        if (remaining.length > 0) {
          localStorage.setItem('cart_remaining_after_order', JSON.stringify(remaining))
        }
        alert('Đặt hàng thành công!')
        navigate('/orders')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi đặt hàng')
    } finally {
      setLoading(false)
    }
  }

  // Gom nhóm nhà hàng
  const restaurantsInCart = (() => {
    const map = new Map()
    for (const it of cart) {
      const id = it.restaurantId || 'unknown'
      if (!map.has(id)) map.set(id, { id, name: it.restaurantName || 'Nhà hàng', items: [] })
      map.get(id).items.push(it)
    }
    return Array.from(map.values())
  })()

  const filteredItems = cart.filter(i => i.restaurantId === selectedRestaurantId)
  const totalsForSelected = calculateTotals(filteredItems)

  if (cart.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Hãy thêm vài món ngon vào nhé!</p>
          <button className="btn-primary" style={{maxWidth: 200, margin: '20px auto'}} onClick={() => navigate('/restaurants')}>
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-container">
      {/* 1. Thanh điều hướng Step */}
      <div className="checkout-steps">
        <button className={`step-btn ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
          1. Xem Giỏ hàng
        </button>
        <span className="text-gray-300">/</span>
        <button 
          className={`step-btn ${step === 2 ? 'active' : ''}`} 
          onClick={() => selectedRestaurantId && setStep(2)} 
          disabled={!selectedRestaurantId}
        >
          2. Thông tin & Thanh toán
        </button>
      </div>

      {/* 2. Wrapper chính - Thay đổi class dựa theo Step */}
      <div className={`checkout-wrapper step-${step}`}>
        
        {/* --- LEFT SIDE --- */}
        <div className="checkout-left">
          
          {/* == STEP 1: DANH SÁCH MÓN (HIỂN THỊ TO) == */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="section-title">🛒 Các món đã chọn</div>
              
              {restaurantsInCart.map(r => (
                <div key={r.id} className="cart-group">
                  <div className="group-header">
                     <label className="group-select">
                        <input 
                          type="radio" 
                          name="selectRest" 
                          checked={selectedRestaurantId === r.id} 
                          onChange={() => setSelectedRestaurantId(r.id)} 
                        />
                        <span>Đơn hàng từ: <strong>{r.name}</strong> ({r.items.length} món)</span>
                     </label>
                  </div>
                  
                  <div>
                    {r.items.map(item => (
                      <div key={item.menuItemId} className="checkout-item">
                        {/* Ảnh thumbnail giả lập (nếu có API ảnh thì thêm vào) */}
                        <div style={{width: 80, height: 80, background: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24}}>
                           🍔
                        </div>
                        
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-price">{item.price.toLocaleString('vi-VN')} ₫</div>
                        </div>

                        <div className="qty-controls">
                          <button className="qty-btn" onClick={() => removeFromCart(item, false)}>−</button>
                          <span className="qty-display">{item.quantity}</span>
                          <button className="qty-btn" onClick={() => removeFromCart(item, true)}>+</button>
                        </div>

                        <div className="item-subtotal">
                          {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                        </div>

                        <button className="remove-item" title="Xóa món" onClick={() => removeFromCart(item, 'remove')}>
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Nút chuyển tiếp lớn */}
              <div style={{ marginTop: 20, textAlign: 'right' }}>
                 <div style={{fontSize: '1.2rem', marginBottom: 10, fontWeight: 'bold'}}>
                    Tạm tính: <span style={{color: '#2563eb'}}>{totalsForSelected.subtotal.toLocaleString('vi-VN')} ₫</span>
                 </div>
                 <button 
                    className="btn-primary" 
                    style={{maxWidth: 300, marginLeft: 'auto'}}
                    onClick={() => {
                      if (!selectedRestaurantId) {
                        setError('Vui lòng chọn nhà hàng để thanh toán')
                        return
                      }
                      setError('')
                      setStep(2)
                    }}
                 >
                    Tiến hành đặt hàng ➜
                 </button>
              </div>
            </div>
          )}

          {/* == STEP 2: FORM THÔNG TIN (BÊN TRÁI) == */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button className="btn-secondary" style={{marginBottom: 20}} onClick={() => setStep(1)}>
                 ← Quay lại sửa món
              </button>

              <div className="section-box">
                <div className="section-title">📦 Thông tin giao hàng</div>
                
                <div className="form-group">
                  <label>Họ và tên người nhận <span className="text-red-500">*</span></label>
                  <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="VD: Nguyễn Văn A" className="form-input" />
                </div>

                <div className="form-group">
                  <label>Số điện thoại <span className="text-red-500">*</span></label>
                  <input type="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="VD: 0909..." className="form-input" />
                </div>

                <div className="form-group">
                  <label>Địa chỉ nhận hàng <span className="text-red-500">*</span></label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="text" value={deliveryAddress.fullAddress || ''} readOnly placeholder="Vui lòng chọn trên bản đồ..." className="form-input" style={{ flex: 1, background: '#f9fafb' }} />
                    <button type="button" className="btn-secondary" onClick={() => setShowAddressForm(true)}>📍 Chọn bản đồ</button>
                  </div>
                  {deliveryLocation && (
                    <div style={{marginTop: 8, fontSize: '0.9rem', color: '#059669', fontWeight: 500}}>
                       ✓ Đã ghim vị trí: {deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Ghi chú cho tài xế</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="VD: Gọi trước khi đến, không cay..." className="form-input" rows="3" />
                </div>
              </div>

              <div className="section-box" style={{marginTop: 24}}>
                <div className="section-title">💳 Phương thức thanh toán</div>
                <div className="payment-options">
                  <label className="payment-option">
                    <input type="radio" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span className="payment-label">Thanh toán khi nhận hàng (Tiền mặt/Chuyển khoản)</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" value="ONLINE" checked={paymentMethod === 'ONLINE'} onChange={(e) => setPaymentMethod(e.target.value)} />
                    <span className="payment-label">Thanh toán Ví điện tử / Ngân hàng</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- RIGHT SIDE: CHỈ HIỆN Ở STEP 2 --- */}
        {step === 2 && (
          <div className="checkout-right animate-fade-in">
            <div className="order-summary">
              <div className="section-title" style={{fontSize: '1.1rem'}}>📝 Tóm tắt đơn hàng</div>
              
              <div style={{maxHeight: 300, overflowY: 'auto', marginBottom: 16}}>
                {filteredItems.map(item => (
                  <div key={item.menuItemId} className="summary-item">
                    <span><strong>{item.quantity}x</strong> {item.name}</span>
                    <span>{(item.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))}
              </div>

              <div className="summary-divider" />
              
              <div className="summary-row">
                <span>Tạm tính</span>
                <span style={{fontWeight: 600}}>{totalsForSelected.subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span style={{fontWeight: 600}}>
                   {deliveryLocation ? `${totalsForSelected.deliveryFee.toLocaleString('vi-VN')} ₫` : '---'}
                </span>
              </div>
              
              <div className="summary-total">
                <span>Tổng thanh toán</span>
                <span className="total-amount">{totalsForSelected.total.toLocaleString('vi-VN')} ₫</span>
              </div>

              {error && <div style={{background: '#fee2e2', color: '#b91c1c', padding: 10, borderRadius: 6, marginTop: 10, fontSize: '0.9rem'}}>⚠️ {error}</div>}

              <button className="btn-checkout" onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'ĐẶT HÀNG NGAY'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Address Modal */}
      {showAddressForm && (
        <AddressForm onConfirm={handleMapSelect} onCancel={() => setShowAddressForm(false)} />
      )}
    </div>
  )
}
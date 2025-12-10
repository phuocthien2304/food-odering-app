import { useState } from 'react'
import axios from 'axios'
import MapPicker from '../components/MapPicker'
import '../styles/CreateRestaurantPage.css'

export default function RestaurantRegister({ API_URL, navigate, user }) {
  const [form, setForm] = useState({ name: '', description: '', phoneNumber: '', email: '' })
  const [location, setLocation] = useState(null)
  const [addressText, setAddressText] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const ownerId = localStorage.getItem('pendingOwnerId') || (user && (user.id || user._id))

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleMapSelect = (data) => {
    setLocation({ lat: data.lat, lng: data.lng })
    const display = data.address?.display_name || (typeof data.address === 'string' ? data.address : '')
    setAddressText(display)
    setShowMap(false)
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên nhà hàng')
      return false
    }
    if (!form.phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại')
      return false
    }
    if (!form.email.trim()) {
      setError('Vui lòng nhập email')
      return false
    }
    if (!location) {
      setError('Vui lòng chọn vị trí nhà hàng trên bản đồ')
      return false
    }
    if (!addressText) {
      setError('Vui lòng chọn địa chỉ từ bản đồ')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const payload = {
        ownerId,
        name: form.name,
        description: form.description,
        phoneNumber: form.phoneNumber,
        email: form.email,
        address: { street: addressText },
        location: { lat: location.lat, lng: location.lng }
      }
      await axios.post(`${API_URL}/restaurants`, payload)
      alert('Nhà hàng đã được tạo. Chờ admin duyệt.')
      localStorage.removeItem('pendingOwnerId')
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Tạo nhà hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-restaurant-container">
      <div className="register-wrapper">
        {/* LEFT: Form */}
        <div className="register-left">
          <h2>Đăng ký Nhà hàng</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>Vui lòng điền đầy đủ thông tin nhà hàng của bạn</p>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Tên nhà hàng <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Tên nhà hàng của bạn"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Mô tả nhà hàng</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Mô tả về nhà hàng (ẩm thực, đặc trưng, ...)"
                className="form-input"
                rows="4"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Số điện thoại <span className="required">*</span></label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="Số điện thoại"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email nhà hàng"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Địa chỉ nhà hàng <span className="required">*</span></label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={addressText}
                  readOnly
                  placeholder="Chọn vị trí trên bản đồ"
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn-map"
                  onClick={() => setShowMap(true)}
                >
                  Chọn trên bản đồ
                </button>
              </div>
              {location && (
                <div className="location-display">
                  Vị trí: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </div>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Đang gửi...' : 'Đăng ký Nhà hàng'}
            </button>
          </form>
        </div>

        {/* RIGHT: Preview */}
        <div className="register-right">
          <div className="register-preview">
            <div className="preview-title">Xem trước</div>

            <div className="preview-item">
              <span className="preview-label">Tên nhà hàng</span>
              <span className="preview-value">{form.name || 'Chưa nhập'}</span>
            </div>

            <div className="preview-item">
              <span className="preview-label">Số điện thoại</span>
              <span className="preview-value">{form.phoneNumber || 'Chưa nhập'}</span>
            </div>

            <div className="preview-item">
              <span className="preview-label">Email</span>
              <span className="preview-value">{form.email || 'Chưa nhập'}</span>
            </div>

            <div className="preview-item">
              <span className="preview-label">Địa chỉ</span>
              <span className="preview-value" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                {addressText || 'Chưa chọn'}
              </span>
            </div>

            <div className="preview-item">
              <span className="preview-label">Mô tả</span>
              <span className="preview-value" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                {form.description || 'Chưa nhập'}
              </span>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', background: '#f0f7ff', borderLeft: '3px solid #0066cc', borderRadius: '4px', fontSize: '0.85rem', color: '#0066cc' }}>
              <strong>Lưu ý:</strong> Nhà hàng của bạn sẽ chờ duyệt của admin trước khi công khai trên nền tảng.
            </div>
          </div>
        </div>
      </div>

      {/* Map picker */}
      {showMap && (
        <MapPicker onSelect={handleMapSelect} onClose={() => setShowMap(false)} />
      )}
    </div>
  )
}

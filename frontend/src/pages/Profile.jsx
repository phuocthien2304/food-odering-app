import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Profile({ API_URL, user }) {
  const [profile, setProfile] = useState(user || null)
  const [restaurant, setRestaurant] = useState(null)

  useEffect(() => {
    if (!profile) fetchProfile()
    else if (profile.restaurantId) fetchRestaurant(profile.restaurantId)
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      setProfile(res.data)
      if (res.data.restaurantId) fetchRestaurant(res.data.restaurantId)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRestaurant = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/restaurants/${id}`)
      setRestaurant(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  if (!profile) return <div>Đang tải hồ sơ...</div>

  return (
    <div className="profile-page">
      <h2>Hồ sơ của bạn</h2>
      <div className="profile-card">
        <p><strong>Họ tên:</strong> {profile.firstName || profile.name || profile.email}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Loại tài khoản:</strong> {profile.userType}</p>

        {profile.userType === 'CUSTOMER' && (
          <>
            <h3>Địa chỉ mặc định</h3>
            {profile.defaultAddress ? (
              <div>
                <p>{profile.defaultAddress.street}</p>
                <p>{profile.defaultAddress.district}, {profile.defaultAddress.city}</p>
              </div>
            ) : <p>Chưa có địa chỉ mặc định</p>}
          </>
        )}

        {profile.userType === 'RESTAURANT_STAFF' && (
          <>
            <h3>Nhà hàng</h3>
            {restaurant ? (
              <div>
                <p><strong>{restaurant.name}</strong></p>
                <p>{restaurant.description}</p>
                <p>Trạng thái: {restaurant.isVerified ? 'Đã duyệt' : 'Đang chờ duyệt'}</p>
                <p>Địa chỉ: {restaurant.address?.street}</p>
              </div>
            ) : (
              <p>Chưa có nhà hàng. Hãy đăng ký 1 nhà hàng.</p>
            )}
          </>
        )}

        {profile.userType === 'ADMIN' && (
          <>
            <h3>Quyền quản trị</h3>
            <p>Bạn là admin, có thể duyệt nhà hàng và quản lý người dùng.</p>
          </>
        )}
      </div>
    </div>
  )
}

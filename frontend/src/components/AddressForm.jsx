import { useState, useEffect } from 'react'
import { getProvinces, getDistricts, getWards } from '../lib/addressData'
import MapPicker from './MapPicker'
import '../styles/AddressForm.css'

export default function AddressForm({ onConfirm, onCancel }) {
  const [step, setStep] = useState(1) // 1: select address, 2: pick on map
  const [province, setProvince] = useState('') // will store province code
  const [district, setDistrict] = useState('') // will store district code
  const [ward, setWard] = useState('') // will store ward name
  const [street, setStreet] = useState('')
  const [error, setError] = useState('')
  const [mapLocation, setMapLocation] = useState(null)

  const [provincesList, setProvincesList] = useState([])
  const [districtsList, setDistrictsList] = useState([])
  const [wardsList, setWardsList] = useState([])

  useEffect(() => {
    let mounted = true
    getProvinces().then(list => {
      if (mounted) setProvincesList(list)
    }).catch(() => setProvincesList([]))
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!province) {
      setDistrictsList([])
      setDistrict('')
      return
    }
    let mounted = true
    getDistricts(province).then(list => {
      if (mounted) setDistrictsList(list)
    }).catch(() => setDistrictsList([]))
    return () => { mounted = false }
  }, [province])

  useEffect(() => {
    if (!district || !province) {
      setWardsList([])
      setWard('')
      return
    }
    let mounted = true
    getWards(province, district).then(list => {
      if (mounted) setWardsList(list)
    }).catch(() => setWardsList([]))
    return () => { mounted = false }
  }, [province, district])

  const handleAddressSelect = () => {
    if (!province || !district || !ward || !street) {
      setError('Vui lòng nhập đầy đủ thông tin địa chỉ')
      return
    }
    setError('')
    // Combine address string for Nominatim search
    const provinceObj = provincesList.find(p => String(p.code) === String(province))
    const districtObj = districtsList.find(d => String(d.code) === String(district))
    const provinceName = provinceObj ? provinceObj.name : province
    const districtName = districtObj ? districtObj.name : district
    const addressString = `${street}, ${ward}, ${districtName}, ${provinceName}, Vietnam`
    // Fallback lat/lng based on common cities
    const fallbackLat = provinceName && provinceName.toLowerCase().includes('hcm') ? 10.776 : 21.028
    const fallbackLng = provinceName && provinceName.toLowerCase().includes('hcm') ? 106.7 : 105.854
    setMapLocation({ lat: fallbackLat, lng: fallbackLng, address: addressString })
    setStep(2)
  }

  const handleMapConfirm = (data) => {
    const provinceObj = provincesList.find(p => String(p.code) === String(province))
    const districtObj = districtsList.find(d => String(d.code) === String(district))
    const finalAddress = {
      province: provinceObj ? provinceObj.name : province,
      district: districtObj ? districtObj.name : district,
      ward,
      street,
      lat: data.lat,
      lng: data.lng,
      fullAddress: `${street}, ${ward}, ${districtObj ? districtObj.name : district}, ${provinceObj ? provinceObj.name : province}`
    }
    onConfirm(finalAddress)
  }

  return (
    <div className="address-modal-overlay">
      <div className="address-modal">
        {step === 1 ? (
          <div className="address-form-step1">
            <h2>Chọn địa chỉ giao hàng</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Tỉnh / Thành phố <span className="required">*</span></label>
                <select
                  value={province}
                  onChange={(e) => {
                    setProvince(e.target.value)
                    setDistrict('')
                    setWard('')
                  }}
                  className="form-input"
                >
                  <option value="">-- Chọn tỉnh / thành phố --</option>
                  {provincesList.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quận / Huyện <span className="required">*</span></label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value)
                    setWard('')
                  }}
                  disabled={!province}
                  className="form-input"
                >
                  <option value="">-- Chọn quận / huyện --</option>
                  {districtsList.map(d => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phường / Xã <span className="required">*</span></label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  disabled={!district}
                  className="form-input"
                >
                  <option value="">-- Chọn phường / xã --</option>
                  {wardsList.map(w => (
                    <option key={w.code} value={w.name}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Số nhà, tên đường <span className="required">*</span></label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Nhập số nhà, tên đường"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={onCancel}>Hủy</button>
              <button className="btn-primary" onClick={handleAddressSelect}>
                Tiếp tục xác nhận trên bản đồ →
              </button>
            </div>
          </div>
        ) : (
          <div className="address-form-step2">
            <h2>Xác nhận vị trí trên bản đồ</h2>
            <p className="info-text">
              {street}, {ward}, {districtsList.find(d=>String(d.code)===String(district))?.name || district}, {provincesList.find(p=>String(p.code)===String(province))?.name || province}
            </p>

            {mapLocation && (
              <div className="map-picker-wrapper">
                <MapPicker
                  value={mapLocation}
                  onChange={setMapLocation}
                  onConfirm={handleMapConfirm}
                />
              </div>
            )}

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>← Quay lại</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

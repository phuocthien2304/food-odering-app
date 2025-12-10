// Dữ liệu địa chỉ hành chính Việt Nam (Cập nhật chính xác)
// Cấu trúc: { tỉnh: { quận: [phường] } }

// Helpers to fetch official provinces/districts/wards from
// https://provinces.open-api.vn (depth=3) at runtime.
// This file provides two things:
// 1) A small static fallback `vietnamAddressData` used when offline.
// 2) Async helpers `fetchAllProvinces`, `getProvinces`, `getDistricts`, `getWards`
//    which call the official open-api and return consistent structures.

export const vietnamAddressData = {
  "Hà Nội": { "Ba Đình": ["Phúc Tân", "Trúc Bạch", "Cống Vị"], "Hoàn Kiếm": ["Hàng Bài", "Hàng Gai"] },
  "TP. Hồ Chí Minh": { "Quận 1": ["Bến Nghé", "Đa Kao"], "Quận 9": ["Phú Hữu", "Phước Long A", "Phước Long B"] }
}

const BASE = 'https://provinces.open-api.vn/api/v1'

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  return res.json()
}

// Fetch all provinces with nested districts and wards (depth=3).
export async function fetchAllProvinces(depth = 3) {
  const url = `${BASE}/p/?depth=${depth}`
  return fetchJson(url)
}

// Get the list of provinces (name + code). Uses depth=1 to be lightweight.
export async function getProvinces() {
  const url = `${BASE}/p/?depth=1`
  const data = await fetchJson(url)
  return data.map(p => ({ name: p.name, code: p.code, codename: p.codename }))
}

// Get districts for a province. provinceCode can be numeric code or codename.
// Returns array of { name, code, codename }
export async function getDistricts(provinceCode) {
  const url = `${BASE}/p/${provinceCode}?depth=2`
  const data = await fetchJson(url)
  if (!data.districts) return []
  return data.districts.map(d => ({ name: d.name, code: d.code, codename: d.codename }))
}

// Get wards for a given province and district. You can provide provinceCode
// (or codename) and districtCode (or codename). This will fetch the province
// with depth=3 and find the district's wards.
export async function getWards(provinceCode, districtCode) {
  const url = `${BASE}/p/${provinceCode}?depth=3`
  const data = await fetchJson(url)
  if (!data.districts) return []
  const district = data.districts.find(d => d.code === Number(districtCode) || d.codename === String(districtCode) || d.name === String(districtCode))
  if (!district || !district.wards) return []
  return district.wards.map(w => ({ name: w.name, code: w.code, codename: w.codename }))
}

// Convenience: find province by name (case-insensitive). Returns province object.
export async function findProvinceByName(name) {
  const list = await getProvinces()
  return list.find(p => p.name.toLowerCase() === String(name).toLowerCase())
}

// You can use the helpers above in your components. Example usage in React:
// const provinces = await getProvinces()
// const districts = await getDistricts(provinceCode)
// const wards = await getWards(provinceCode, districtCode)
// You can use the helpers above in your components. Example usage in React:
// const provinces = await getProvinces()
// const districts = await getDistricts(provinceCode)
// const wards = await getWards(provinceCode, districtCode)

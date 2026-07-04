// Mock data untuk semua fitur
export const mockUsers = [
  {
    id: 'user-001',
    full_name: 'Sarah Jenkins',
    email: 'sarah@company.com',
    role: 'user',
    department: 'Engineering',
    employee_id: 'EMP-001',
    access_level: 3,
    phone: '+62 812 3456 7890',
    location: 'Jakarta',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop'
  },
  {
    id: 'user-002',
    full_name: 'Robert Chen',
    email: 'robert@company.com',
    role: 'user',
    department: 'Operations',
    employee_id: 'EMP-002',
    access_level: 2,
    phone: '+62 812 3456 7891',
    location: 'Jakarta',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
  },
  {
    id: 'admin-001',
    full_name: 'John Doe',
    email: 'admin@PT Dera Manufacturing.io',
    role: 'admin',
    department: 'Operations Security',
    employee_id: 'SP-2024-0113',
    access_level: 4,
    phone: '+62 812 3456 7892',
    location: 'Jakarta Selatan',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop'
  }
]

export const mockNodes = [
  {
    id: 'node-001',
    name: 'North Wing Entrance',
    location: 'North Wing, Building A',
    node_id: 'SC-001',
    status: 'online',
    type: 'entrance',
    last_scan: '2m ago',
    latitude: -6.2088,
    longitude: 106.8456,
    last_ping: new Date().toISOString()
  },
  {
    id: 'node-002',
    name: 'Main Lobby A',
    location: 'Main Lobby, Building A',
    node_id: 'SC-002',
    status: 'online',
    type: 'entrance',
    last_scan: '14m ago',
    latitude: -6.2089,
    longitude: 106.8458,
    last_ping: new Date().toISOString()
  },
  {
    id: 'node-003',
    name: 'East Elevator Bank',
    location: 'East Wing, Building B',
    node_id: 'SC-009',
    status: 'offline',
    type: 'elevator',
    last_scan: '45m ago',
    latitude: -6.2090,
    longitude: 106.8460,
    last_ping: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'node-004',
    name: 'Loading Dock South',
    location: 'South Wing, Building B',
    node_id: 'SC-015',
    status: 'online',
    type: 'gate',
    last_scan: '1h ago',
    latitude: -6.2092,
    longitude: 106.8454,
    last_ping: new Date().toISOString()
  },
  {
    id: 'node-005',
    name: 'R&D Lab Entrance',
    location: 'R&D Wing, Building C',
    node_id: 'SC-021',
    status: 'online',
    type: 'entrance',
    last_scan: '5m ago',
    latitude: -6.2085,
    longitude: 106.8462,
    last_ping: new Date().toISOString()
  },
  {
    id: 'node-006',
    name: 'Executive Floor',
    location: 'Top Floor, Building A',
    node_id: 'SC-033',
    status: 'lagging',
    type: 'entrance',
    last_scan: '30m ago',
    latitude: -6.2087,
    longitude: 106.8455,
    last_ping: new Date(Date.now() - 1800000).toISOString()
  }
]

export const mockScans = [
  {
    id: 'scan-001',
    user_id: 'user-001',
    node_id: 'node-001',
    status: 'granted',
    scan_time: new Date(Date.now() - 600000).toISOString(),
    device_id: 'DEV-001',
    location: 'North Wing',
    users: mockUsers[0],
    nodes: mockNodes[0]
  },
  {
    id: 'scan-002',
    user_id: 'user-002',
    node_id: 'node-003',
    status: 'denied',
    scan_time: new Date(Date.now() - 1200000).toISOString(),
    device_id: 'DEV-002',
    location: 'East Elevator',
    users: mockUsers[1],
    nodes: mockNodes[2]
  },
  {
    id: 'scan-003',
    user_id: 'user-001',
    node_id: 'node-002',
    status: 'granted',
    scan_time: new Date(Date.now() - 1800000).toISOString(),
    device_id: 'DEV-001',
    location: 'Main Lobby',
    users: mockUsers[0],
    nodes: mockNodes[1]
  },
  {
    id: 'scan-004',
    user_id: 'user-002',
    node_id: 'node-005',
    status: 'granted',
    scan_time: new Date(Date.now() - 3600000).toISOString(),
    device_id: 'DEV-003',
    location: 'R&D Lab',
    users: mockUsers[1],
    nodes: mockNodes[4]
  },
  {
    id: 'scan-005',
    user_id: 'admin-001',
    node_id: 'node-004',
    status: 'granted',
    scan_time: new Date(Date.now() - 7200000).toISOString(),
    device_id: 'DEV-004',
    location: 'Loading Dock',
    users: mockUsers[2],
    nodes: mockNodes[3]
  }
]

export const mockPermits = [
  {
    id: 'permit-001',
    user_id: 'user-001',
    permit_code: 'SP-2024-8891',
    valid_until: new Date('2024-12-31T23:59:59').toISOString(),
    access_level: 3,
    is_active: true,
    created_at: new Date('2024-01-15').toISOString()
  },
  {
    id: 'permit-002',
    user_id: 'user-002',
    permit_code: 'SP-2024-8892',
    valid_until: new Date('2024-11-30T23:59:59').toISOString(),
    access_level: 2,
    is_active: true,
    created_at: new Date('2024-02-20').toISOString()
  },
  {
    id: 'permit-003',
    user_id: 'admin-001',
    permit_code: 'SP-2024-8893',
    valid_until: new Date('2025-06-30T23:59:59').toISOString(),
    access_level: 4,
    is_active: true,
    created_at: new Date('2024-03-10').toISOString()
  }
]

// Generate QR Code SVG yang lebih realistis
export const generateQRCodeSVG = (permitCode) => {
  // Buat pattern QR sederhana
  const size = 200
  const blocks = 8
  const blockSize = size / blocks
  
  let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`
  svg += `<rect width="${size}" height="${size}" fill="white"/>`
  
  // Generate random pattern untuk QR
  for (let row = 0; row < blocks; row++) {
    for (let col = 0; col < blocks; col++) {
      // Buat pola berdasarkan permit code
      const charCode = permitCode.charCodeAt((row + col) % permitCode.length) || 65
      const isFilled = (charCode + row * col) % 3 !== 0
      
      if (isFilled) {
        const x = col * blockSize
        const y = row * blockSize
        const fill = (row + col) % 5 === 0 ? '#1d4fe0' : '#13389e'
        svg += `<rect x="${x}" y="${y}" width="${blockSize}" height="${blockSize}" fill="${fill}" rx="2"/>`
      }
    }
  }
  
  // Tambahkan marker sudut
  const addCorner = (x, y) => {
    svg += `<rect x="${x}" y="${y}" width="${blockSize * 2.5}" height="${blockSize * 2.5}" fill="none" stroke="#0f2f9e" stroke-width="3" rx="4"/>`
    svg += `<rect x="${x + blockSize * 0.5}" y="${y + blockSize * 0.5}" width="${blockSize * 1.5}" height="${blockSize * 1.5}" fill="#0f2f9e" rx="3"/>`
    svg += `<rect x="${x + blockSize}" y="${y + blockSize}" width="${blockSize * 0.5}" height="${blockSize * 0.5}" fill="white" rx="2"/>`
  }
  
  addCorner(blockSize * 0.5, blockSize * 0.5)
  addCorner(size - blockSize * 3, blockSize * 0.5)
  addCorner(blockSize * 0.5, size - blockSize * 3)
  
  // Text di tengah
  svg += `<text x="${size/2}" y="${size/2 + 5}" font-family="monospace" font-size="12" fill="#0f2f9e" text-anchor="middle" font-weight="bold">${permitCode}</text>`
  
  svg += `</svg>`
  return svg
}

export const generateMockQR = (permitCode) => {
  return {
    qr_data: `PT Dera Manufacturing:${permitCode}:${Date.now()}`,
    qr_svg: generateQRCodeSVG(permitCode),
    qr_code: permitCode
  }
}

// Location settings
export const officeLocations = [
  { id: 'loc-001', name: 'Headquarters - Jakarta', latitude: -6.2088, longitude: 106.8456, radius: 100 },
  { id: 'loc-002', name: 'Branch - Surabaya', latitude: -7.2575, longitude: 112.7521, radius: 80 },
  { id: 'loc-003', name: 'R&D Center - Bandung', latitude: -6.9175, longitude: 107.6191, radius: 50 }
]

// Stats
export const mockStats = {
  totalScans: 12842,
  uniqueUsers: 452,
  activeLocations: 24,
  successRate: 98.4,
  dailyPermits: 1105,
  totalNodes: 24,
  onlineNodes: 21,
  offlineNodes: 2,
  laggingNodes: 1,
  recentActivities: mockScans.slice(0, 5)
}
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'

const selectedNetwork = findPreferredLanHost()
const displayHost =
  process.env.FRONTEND_HOST ||
  process.env.VITE_DEV_HOST ||
  selectedNetwork?.address ||
  '127.0.0.1'

const bindHost =
  process.env.FRONTEND_HOST ||
  process.env.VITE_DEV_HOST ||
  '0.0.0.0'

const port = Number(process.env.FRONTEND_PORT || process.env.VITE_DEV_PORT || '9002')

process.env.__REPAY_RECORD_DEV_HOST__ = bindHost
process.env.__REPAY_RECORD_DEV_PORT__ = String(port)

const server = await createServer({
  clearScreen: false
})

await server.listen()

console.log(`[dev-server] Listening on ${bindHost}:${port}`)
if (selectedNetwork?.name) {
  console.log(`[dev-server] Current adapter ${selectedNetwork.name}`)
}

if (bindHost === '127.0.0.1') {
  console.log(`  Local:   http://127.0.0.1:${port}/`)
} else {
  console.log(`  Local:   http://localhost:${port}/`)
  console.log(`  Network: http://${displayHost}:${port}/`)
}

const shutdown = async () => {
  await server.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

function findPreferredLanHost() {
  const interfaces = os.networkInterfaces()
  const candidates = []

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses || []) {
      if (address.family !== 'IPv4' || address.internal) continue
      if (!isPrivateIPv4(address.address)) continue
      candidates.push({ name, address: address.address })
    }
  }

  const defaultRouteCandidate = findWindowsDefaultRouteCandidate(candidates)
  if (defaultRouteCandidate) {
    return defaultRouteCandidate
  }

  candidates.sort(compareLanPriority)
  return candidates[0]
}

function findWindowsDefaultRouteCandidate(candidates) {
  if (process.platform !== 'win32' || !candidates.length) return null

  try {
    const command = [
      "Get-NetRoute -AddressFamily IPv4 -DestinationPrefix '0.0.0.0/0'",
      'Sort-Object RouteMetric, InterfaceMetric',
      'Select-Object InterfaceAlias, InterfaceIndex, NextHop',
      'ConvertTo-Json -Compress'
    ].join(' | ')

    const output = execFileSync('powershell.exe', ['-NoProfile', '-Command', command], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
    if (!output) return null

    const parsed = JSON.parse(output)
    const routes = Array.isArray(parsed) ? parsed : [parsed]

    for (const route of routes) {
      const match = candidates.find((candidate) => {
        return (
          candidate.name === route.InterfaceAlias &&
          !isDiscardedInterface(candidate.name) &&
          !isDiscardedGateway(route.NextHop)
        )
      })

      if (match) {
        return match
      }
    }
  } catch {
    return null
  }

  return null
}

function isPrivateIPv4(ip) {
  return (
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  )
}

function compareLanPriority(a, b) {
  return (
    getIpPriority(a.address) - getIpPriority(b.address) ||
    getInterfacePriority(a.name) - getInterfacePriority(b.name) ||
    getHostOctetPriority(a.address) - getHostOctetPriority(b.address) ||
    a.address.localeCompare(b.address)
  )
}

function getIpPriority(ip) {
  if (ip.startsWith('192.168.')) return 0
  if (ip.startsWith('10.')) return 1
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return 2
  return 99
}

function getInterfacePriority(name) {
  const normalized = name.toLowerCase()

  if (isDiscardedInterface(name)) return 99
  if (/(wlan|wi-?fi|wireless)/.test(normalized)) return 0
  if (/(ethernet|eth|lan)/.test(normalized)) return 1
  return 10
}

function getHostOctetPriority(ip) {
  const octets = ip.split('.')
  const lastOctet = Number(octets[3] || 0)

  if (lastOctet === 1) return 10
  if (lastOctet >= 2 && lastOctet <= 20) return 5
  return 0
}

function isDiscardedInterface(name) {
  return /(vmware|vethernet|virtual|hyper-v|docker|loopback|tailscale|zerotier|hamachi|meta)/i.test(name)
}

function isDiscardedGateway(ip) {
  return !ip || ip.startsWith('198.18.')
}

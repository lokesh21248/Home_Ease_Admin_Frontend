import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'

// Vite dev middleware plugin to handle Explore Services endpoints locally with disk persistence
function exploreServicesDevPlugin() {
  const dataFilePath = path.resolve(process.cwd(), 'src/data/exploreServices.json')

  const loadData = () => {
    try {
      if (fs.existsSync(dataFilePath)) {
        return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'))
      }
    } catch (e) {
      console.warn('[ExploreServices Dev Server] Error reading exploreServices.json:', e.message)
    }
    return []
  }

  const saveData = (data) => {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (e) {
      console.warn('[ExploreServices Dev Server] Error writing exploreServices.json:', e.message)
    }
  }

  return {
    name: 'vite-explore-services-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const parsedUrl = new URL(req.url, 'http://localhost')
        const pathname = parsedUrl.pathname

        // 1. Intercept image upload: proxy /api/v1/upload/explore-service-image to EC2's active /api/v1/upload/service-image
        if (
          pathname === '/api/v1/upload/explore-service-image' ||
          pathname === '/upload/explore-service-image'
        ) {
          const proxyReq = http.request(
            'http://3.108.55.219:8080/api/v1/upload/service-image',
            {
              method: req.method,
              headers: {
                ...req.headers,
                host: '3.108.55.219:8080',
              },
            },
            (proxyRes) => {
              res.writeHead(proxyRes.statusCode || 200, proxyRes.headers)
              proxyRes.pipe(res)
            }
          )
          proxyReq.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: err.message }))
          })
          req.pipe(proxyReq)
          return
        }

        // 2. Explore Services API endpoints
        const isAdminExplore = pathname.startsWith('/api/v1/admin/explore-services')
        const isCustomerExplore =
          pathname.startsWith('/api/v1/customer/explore-services') ||
          pathname === '/api/v1/explore-services' ||
          pathname.startsWith('/explore-services')

        if (!isAdminExplore && !isCustomerExplore) {
          return next()
        }

        const method = req.method
        let items = loadData()

        const sendJson = (status, payload) => {
          res.writeHead(status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          res.end(JSON.stringify(payload))
        }

        const readBody = (callback) => {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              callback(body ? JSON.parse(body) : {})
            } catch (err) {
              sendJson(400, { error: 'Invalid JSON payload' })
            }
          })
        }

        // Customer GET active items
        if (isCustomerExplore && method === 'GET') {
          const categoryId = parsedUrl.searchParams.get('categoryId')
          let activeItems = items.filter((i) => i.isActive !== false && !i.deletedAt)
          if (categoryId) {
            activeItems = activeItems.filter((i) => i.categoryId === categoryId)
          }
          activeItems.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          return sendJson(200, activeItems)
        }

        // Admin: PATCH /api/v1/admin/explore-services/reorder
        if (pathname === '/api/v1/admin/explore-services/reorder' && method === 'PATCH') {
          readBody((body) => {
            const reorderList = body.items || []
            const orderMap = new Map(reorderList.map((it) => [it.id, it.displayOrder]))
            items = items.map((item) =>
              orderMap.has(item.id) ? { ...item, displayOrder: orderMap.get(item.id) } : item
            )
            items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
            saveData(items)
            return sendJson(200, { status: 'SUCCESS', message: 'Explore services reordered successfully' })
          })
          return
        }

        // Admin: PATCH /api/v1/admin/explore-services/:id/status
        const statusMatch = pathname.match(/\/explore-services\/([^/]+)\/status$/)
        if (statusMatch && method === 'PATCH') {
          const targetId = statusMatch[1]
          readBody((body) => {
            let updatedItem = null
            items = items.map((item) => {
              if (item.id === targetId) {
                updatedItem = {
                  ...item,
                  isActive: Boolean(body.isActive),
                  updatedAt: new Date().toISOString(),
                }
                return updatedItem
              }
              return item
            })
            saveData(items)
            return sendJson(200, updatedItem || { id: targetId, isActive: Boolean(body.isActive) })
          })
          return
        }

        // Admin: /api/v1/admin/explore-services/:id (GET, PUT, DELETE)
        const singleMatch = pathname.match(/\/explore-services\/([^/]+)$/)
        if (singleMatch) {
          const targetId = singleMatch[1]

          if (method === 'GET') {
            const item = items.find((i) => i.id === targetId)
            if (!item) return sendJson(404, { error: 'Not found' })
            return sendJson(200, item)
          }

          if (method === 'PUT') {
            readBody((body) => {
              let updatedItem = null
              items = items.map((item) => {
                if (item.id === targetId) {
                  updatedItem = {
                    ...item,
                    ...body,
                    id: targetId,
                    updatedAt: new Date().toISOString(),
                  }
                  return updatedItem
                }
                return item
              })
              saveData(items)
              return sendJson(200, updatedItem || body)
            })
            return
          }

          if (method === 'DELETE') {
            const isHard = parsedUrl.searchParams.get('hard') === 'true'
            if (isHard) {
              items = items.filter((i) => i.id !== targetId)
            } else {
              items = items.map((i) =>
                i.id === targetId ? { ...i, isActive: false, deletedAt: new Date().toISOString() } : i
              )
            }
            saveData(items)
            return sendJson(200, { status: 'SUCCESS', message: 'Explore service removed successfully' })
          }
        }

        // Admin: GET all items
        if (pathname === '/api/v1/admin/explore-services' && method === 'GET') {
          items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
          return sendJson(200, items)
        }

        // Admin: POST create new item
        if (pathname === '/api/v1/admin/explore-services' && method === 'POST') {
          readBody((body) => {
            const newItem = {
              id: body.id || `exp-${Date.now()}`,
              name: body.name || 'Untitled Service',
              slug:
                body.slug ||
                (body.name || 'service')
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/(^-|-$)/g, ''),
              description: body.description || '',
              categoryId: body.categoryId || null,
              imageUrl: body.imageUrl || '',
              price: Number(body.price) || 0,
              originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
              rating: Number(body.rating) || 4.8,
              reviewCount: Number(body.reviewCount) || 0,
              displayOrder: Number(body.displayOrder) || items.length + 1,
              isActive: body.isActive !== false,
              isFeatured: Boolean(body.isFeatured),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            items = [newItem, ...items]
            saveData(items)
            return sendJson(201, newItem)
          })
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), exploreServicesDevPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://3.108.55.219:8080',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        proxyTimeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('[Vite Proxy]', err.message)
          })
        },
      },
      '/upload': {
        target: 'http://3.108.55.219:8080',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        proxyTimeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            console.warn('[Vite Proxy Upload]', err.message)
          })
        },
      },
    },
  },
})

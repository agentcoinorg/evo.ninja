import { NextRequest, NextResponse, userAgent } from 'next/server'
 
export function middleware(request: NextRequest) {
  const { device } = userAgent(request)
  const viewport = device.type === 'mobile' ? 'mobile' : 'desktop'
  const response = NextResponse.next()
  response.cookies.set("X-User-Device", viewport)
  return response
}
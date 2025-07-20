import { NextRequest, NextResponse } from 'next/server'

interface WhatsAppRequest {
  number: string
  nama: string
  message: string
  pilihan1: string
  pilihan2: string
  pilihan3: string
  prodi_lulus?: string
}

interface WhatsAppSuccessResponse {
  success: true
  message: string
  waResponse: string
}

interface WhatsAppErrorResponse {
  message: string[]
  error: string
  statusCode: number
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppRequest = await request.json()

    // Validasi input
    const errors: string[] = []

    if (!body.number || body.number.trim() === '') {
      errors.push('number should not be empty')
    }

    if (!body.nama || body.nama.trim() === '') {
      errors.push('nama should not be empty')
    }

    if (typeof body.nama !== 'string') {
      errors.push('nama must be a string')
    }

    // Validasi format nomor HP (basic validation)
    if (body.number && !/^(\+62|62|0)8[1-9][0-9]{6,9}$/.test(body.number.replace(/\s/g, ''))) {
      errors.push('number must be a valid Indonesian phone number')
    }

    // Jika ada error validasi, return error response
    if (errors.length > 0) {
      const errorResponse: WhatsAppErrorResponse = {
        message: errors,
        error: 'Bad Request',
        statusCode: 400
      }

      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Simulasi pengiriman WhatsApp (ganti dengan integrasi WhatsApp API yang sebenarnya)
    console.log('Sending WhatsApp message:', {
      to: body.number,
      nama: body.nama,
      message: body.message,
      pilihan1: body.pilihan1,
      pilihan2: body.pilihan2,
      pilihan3: body.pilihan3,
      prodi_lulus: body.prodi_lulus
    })

    // Simulasi delay pengiriman
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Simulasi success rate 95% (untuk testing)
    const isSuccess = Math.random() > 0.05

    if (isSuccess) {
      const successResponse: WhatsAppSuccessResponse = {
        success: true,
        message: 'Pesan berhasil dikirim melalui WhatsApp',
        waResponse: 'Message sent successfully'
      }

      return NextResponse.json(successResponse)
    } else {
      // Simulasi error untuk testing
      const errorResponse: WhatsAppErrorResponse = {
        message: ['Failed to send message', 'WhatsApp service temporarily unavailable'],
        error: 'Service Unavailable',
        statusCode: 503
      }

      return NextResponse.json(errorResponse, { status: 503 })
    }

  } catch (error) {
    console.error('Error in WhatsApp API:', error)

    const errorResponse: WhatsAppErrorResponse = {
      message: ['Internal server error'],
      error: 'Internal Server Error',
      statusCode: 500
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
} 

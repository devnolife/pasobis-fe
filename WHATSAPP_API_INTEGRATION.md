# WhatsApp API Integration Guide

## Current Implementation

The current implementation includes:

1. **Frontend**: WhatsApp Broadcast Manager component with sequential message sending
2. **Backend**: API endpoint at `/api/whatsapp/send` with proper request/response handling
3. **Testing**: HTML test page at `/test-whatsapp-api.html`

## API Endpoint

**URL**: `POST /api/whatsapp/send`

### Request Format
```json
{
  "number": "08123456789",
  "nama": "John Doe",
  "message": "Halo John Doe, terima kasih telah mendaftar...",
  "pilihan1": "Informatika",
  "pilihan2": "Sistem Informasi", 
  "pilihan3": "Teknik Komputer",
  "prodi_lulus": "Informatika"
}
```

### Success Response
```json
{
  "success": true,
  "message": "Pesan berhasil dikirim melalui WhatsApp",
  "waResponse": "Message sent successfully"
}
```

### Error Response
```json
{
  "message": [
    "number should not be empty",
    "nama should not be empty"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

## Integration with Real WhatsApp APIs

### Option 1: WhatsApp Business API (Meta)

1. **Setup**:
   - Register for WhatsApp Business API
   - Get access token and phone number ID
   - Set up webhook for delivery status

2. **Implementation**:
```typescript
// In app/api/whatsapp/send/route.ts
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID

const sendWhatsAppMessage = async (number: string, message: string) => {
  const response = await fetch(
    `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: number,
        type: 'text',
        text: { body: message }
      })
    }
  )
  
  return response.json()
}
```

### Option 2: Third-party WhatsApp APIs

#### Fonnte
```typescript
const sendViaFonnte = async (number: string, message: string) => {
  const response = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: {
      'Authorization': process.env.FONNTE_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target: number,
      message: message
    })
  })
  
  return response.json()
}
```

#### WAblas
```typescript
const sendViaWAblas = async (number: string, message: string) => {
  const response = await fetch('https://domain.wablas.com/api/send-message', {
    method: 'POST',
    headers: {
      'Authorization': process.env.WABLAS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: number,
      message: message
    })
  })
  
  return response.json()
}
```

#### WAblas 2
```typescript
const sendViaWAblas2 = async (number: string, message: string) => {
  const response = await fetch('https://domain.wablas.com/api/send-message', {
    method: 'POST',
    headers: {
      'Authorization': process.env.WABLAS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone: number,
      message: message,
      delay: 2
    })
  })
  
  return response.json()
}
```

## Environment Variables

Add these to your `.env.local`:

```env
# WhatsApp Business API
WHATSAPP_TOKEN=your_whatsapp_token
PHONE_NUMBER_ID=your_phone_number_id

# Or for third-party APIs
FONNTE_TOKEN=your_fonnte_token
WABLAS_TOKEN=your_wablas_token
WABLAS_DOMAIN=your_wablas_domain
```

## Rate Limiting & Best Practices

1. **Sequential Sending**: Messages are sent one by one to avoid rate limiting
2. **Delay Between Messages**: Configurable delay (default: 3 seconds)
3. **Error Handling**: Proper error responses with detailed messages
4. **Validation**: Input validation for phone numbers and required fields
5. **Logging**: Console logging for debugging

## Testing

1. **API Test**: Visit `/test-whatsapp-api.html` to test the API endpoint
2. **Frontend Test**: Use the WhatsApp Broadcast Manager with sample data
3. **Error Testing**: Try invalid phone numbers or empty fields

## Deployment Considerations

1. **Environment Variables**: Set up proper environment variables in production
2. **CORS**: Configure CORS if needed for cross-origin requests
3. **Rate Limiting**: Implement additional rate limiting if required
4. **Monitoring**: Add logging and monitoring for production use
5. **Webhooks**: Set up webhooks for delivery status updates

## Security

1. **API Keys**: Store API keys securely in environment variables
2. **Validation**: Validate all inputs on both frontend and backend
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **HTTPS**: Use HTTPS in production for secure communication 

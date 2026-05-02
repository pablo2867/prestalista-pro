// app/api/sync-airtable/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fecha, tipo, descripcion, monto, usuario } = body

    const apiKey = process.env.AIRTABLE_API_KEY
    const baseId = process.env.AIRTABLE_BASE_ID

    if (!apiKey || !baseId) {
      return NextResponse.json({ error: 'Faltan credenciales de Airtable' }, { status: 500 })
    }

    const url = `https://api.airtable.com/v0/${baseId}/Movimientos`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Fecha: fecha || new Date().toLocaleDateString('es-MX'),
              Tipo: tipo || 'Transacción',
              Descripcion: descripcion || 'Sin descripción',
              Monto: parseFloat(monto) || 0,
              Usuario: usuario || 'Sistema'
            }
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airtable error: ${errorText}`)
    }

    return NextResponse.json({ success: true, message: 'Sincronizado con Airtable' })

  } catch (error: any) {
    console.error('❌ Error Airtable:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
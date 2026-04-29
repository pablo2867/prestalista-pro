// ✅ BUSCA ESTO EN route.ts (alrededor de línea 130-135):

const { error: notifError } = await supabase
  .from('notifications')
  .insert({
    user_id: finalUserId,
    distribuidor_id: distribuidor_id || null,
    type: 'nuevo_prestamo',
    title: '📄 Nuevo Préstamo Creado',
    message: `Préstamo de $${monto.toLocaleString('es-MX')} registrado exitosamente`,
    data: { prestamo_id: inserted?.id, prestatario_id }, // ✅ CORREGIDO: Agregada clave "data:"
    read: false
  })

// ❌ ANTES DECÍA (sin "data:"):
//  { prestamo_id: inserted?.id, prestatario_id },
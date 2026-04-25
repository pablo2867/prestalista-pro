          {/* Header - VERSIÓN ULTRA-SIMPLIFICADA */}
          <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0, color: 'white' }}>🎯 Mis Leads</h1>
                <p style={{ margin: '6px 0 0', opacity: 0.9, color: 'white' }}>Gestiona tu pipeline de ventas</p>
              </div>
              
              {/* 🔘 BOTÓN NUEVO LEAD - ULTRA-SIMPLIFICADO */}
              <button 
                onClick={() => {
                  console.log('🔘 [DEBUG] Botón clickeado - showForm antes:', showForm)
                  setShowForm(prev => {
                    console.log('🔘 [DEBUG] showForm después:', !prev)
                    return !prev
                  })
                }}
                style={{ 
                  padding: '12px 20px', 
                  backgroundColor: showForm ? '#dc2626' : '#ffffff', 
                  color: showForm ? '#fff' : '#2563eb', 
                  border: '2px solid transparent',
                  borderColor: showForm ? '#dc2626' : '#2563eb',
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: 14,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {showForm ? '✕ Cerrar' : '＋ Nuevo Lead'}
              </button>
            </div>
          </div>

          {/* 🔍 INDICADOR VISUAL DE ESTADO (para debugging) */}
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: showForm ? '#065f46' : '#1f2937', 
            borderRadius: '8px', 
            marginBottom: 16,
            fontSize: '12px',
            color: showForm ? '#34d399' : '#9ca3af',
            textAlign: 'center'
          }}>
            Estado del formulario: <strong>{showForm ? '🟢 VISIBLE' : '🔴 OCULTO'}</strong>
          </div>

          {/* Formulario de Lead - SIMPLIFICADO */}
          {showForm && (
            <div style={{ 
              backgroundColor: '#111827', 
              border: '2px solid #3b82f6',  // Borde azul para confirmar que se renderiza
              borderRadius: 12, 
              padding: 20, 
              marginBottom: 24 
            }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 600, color: 'white' }}>📝 Nuevo Lead</h2>
              <form onSubmit={(e) => {
                e.preventDefault()
                console.log('📤 [DEBUG] Formulario enviado', formData)
                handleSubmit(e)
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <input 
                    type="text" 
                    placeholder="Nombre *"
                    value={formData.nombre} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                    required 
                    style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: 16 }} 
                  />
                  <input 
                    type="tel" 
                    placeholder="Teléfono *"
                    value={formData.telefono} 
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                    required 
                    style={{ width: '100%', padding: '12px', backgroundColor: '#030712', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: 16 }} 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={formLoading} 
                  style={{ 
                    width: '100%', 
                    marginTop: 16,
                    padding: '14px', 
                    background: '#2563eb', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontWeight: 'bold', 
                    fontSize: 16 
                  }}
                >
                  {formLoading ? '⏳...' : '💾 Guardar'}
                </button>
              </form>
            </div>
          )}
// ... (todo el código anterior igual hasta handleFileChange) ...

  // ✅ LÓGICA DE SUBIDA DE AVATAR - CORREGIDA CON EMAIL
  const handleAvatarClick = () => fileInputRef.current?.click()
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return
    
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' })
      
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const publicUrl = data.publicUrl
      
      // ✅ INCLUIR EMAIL para evitar error NOT NULL
      await supabase.from('user_profiles').upsert({ 
        id: user.id, 
        avatar_url: publicUrl,
        email: user?.email || null,  // ← Esto soluciona el error
        updated_at: new Date().toISOString()
      })
      
      setAvatarUrl(publicUrl)
      alert('✅ Avatar actualizado exitosamente')
      
    } catch (err: any) {
      console.error('❌ Error:', err)
      alert('Error: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

// ... (el resto del código sigue igual) ...
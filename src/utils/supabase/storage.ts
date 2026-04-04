import { createClient } from '@/utils/supabase/client'

export async function uploadAvatar(file: File, userId: string) {
  const supabase = createClient()
  
  // Eliminar avatar anterior si existe
  const { data: existingFiles } = await supabase.storage
    .from('avatars')
    .list(userId, { limit: 1 })
  
  if (existingFiles && existingFiles.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove([`${userId}/${existingFiles[0].name}`])
  }
  
  // Subir nuevo avatar
  const fileExt = file.name.split('.').pop()
  const fileName = `avatar.${fileExt}`
  const filePath = `${userId}/${fileName}`
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })
  
  if (uploadError) throw uploadError
  
  // Obtener URL pública
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

export function getAvatarUrl(userId: string): string {
  const supabase = createClient()
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar.jpg`)
  
  return data.publicUrl || ''
}
